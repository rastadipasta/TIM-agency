"""Deterministic source-layer reconstruction, 3-D plane projection and video export.

Dependencies: numpy, scipy, Pillow, opencv-python-headless, imageio-ffmpeg, av.
No generated imagery or frame-dependent texture processing is used.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / '.tmp' / 'mountain_orbit_deps'))
import cv2
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter, distance_transform_edt
from scipy.optimize import least_squares, minimize

SOURCE = HERE.parent / 'source' / 'home.png'
LAYERS = HERE / 'layers'
NATIVE = 1254
QUADS = {
    'design': [[312,237],[720,158],[721,758],[313,846]],
    'ideas': [[584,275],[892,330],[893,894],[585,831]],
    'digital': [[831,431],[1051,457],[1052,965],[832,921]],
    'stone': [[205,418],[452,349],[452,693],[206,764]],
}

def save_rgb(path, a):
    Image.fromarray(np.clip(np.rint(a),0,255).astype(np.uint8)).save(path)

def polygon(points, shape=(NATIVE,NATIVE), aa=2):
    a = np.zeros((shape[0]*aa,shape[1]*aa), np.uint8)
    cv2.fillPoly(a,[np.rint(np.array(points)*aa).astype(np.int32)],255)
    return cv2.resize(a,(shape[1],shape[0]),interpolation=cv2.INTER_AREA)/255.0

def rectification(im, name, size, visible):
    w,h=size
    q=np.float32(QUADS[name])
    target=np.float32([[0,0],[w-1,0],[w-1,h-1],[0,h-1]])
    matrix=cv2.getPerspectiveTransform(q,target)
    tex=cv2.warpPerspective(im,matrix,(w,h),flags=cv2.INTER_CUBIC)
    mask=cv2.warpPerspective(visible.astype(np.float32),matrix,(w,h),flags=cv2.INTER_LINEAR)
    return tex,mask

def smooth_background(tex, valid, dark=False):
    h,w=valid.shape
    y,x=np.mgrid[:h,:w].astype(float)
    x=x/w; y=y/h
    lum=tex.mean(axis=2)
    sample=valid & ((lum>12)&(lum<52) if dark else ((lum>183)&(lum<248)&(y<.45)))
    sample[:8]=False; sample[-8:]=False; sample[:,:8]=False; sample[:,-8:]=False
    basis=np.stack([np.ones_like(x),x,y,x*x,x*y,y*y],axis=-1)
    coeff=np.linalg.lstsq(basis[sample][::13],tex[sample][::13],rcond=None)[0]
    return np.clip(basis@coeff,0,255)

def prepare_posters(im):
    masks={k:polygon(q) for k,q in QUADS.items()}
    assets={}
    for name,size in [('design',(820,1100)),('ideas',(650,1100)),('digital',(480,1100)),('stone',(700,900))]:
        visible=masks[name].copy()
        for blocker in {'design':['ideas','digital'],'ideas':['digital'],'digital':[],'stone':['design','ideas','digital']}[name]:
            expanded=cv2.dilate((masks[blocker]>.1).astype(np.uint8),np.ones((17,17),np.uint8))
            visible*=1-expanded
        visible=cv2.erode((visible>.99).astype(np.uint8),np.ones((3,3),np.uint8)).astype(float)
        tex,vm=rectification(im,name,size,visible)
        good=vm>.98
        if name=='design':
            fill=smooth_background(tex,good,dark=True)
        elif name=='ideas':
            fill=smooth_background(tex,good)
            # Continue the folded monochrome artwork only across the concealed strip.
            stable_edge=int(size[0]*.748)
            good[:,stable_edge:]=False
            for row in range(size[1]):
                xs=np.flatnonzero(good[row])
                if len(xs)<20: continue
                edge=stable_edge-3
                columns=np.arange(size[0])
                reflected=np.clip(2*edge-columns,3,edge)
                fill[row]=tex[row,reflected]
        elif name=='stone':
            fill=np.zeros_like(tex,dtype=float)
            sample=tex[:,20:260].astype(float)
            for tile,start in enumerate(range(0,size[0],170)):
                end=min(start+240,size[0]); patch=np.roll(sample,137*tile,axis=0)[:,:end-start]
                if tile:
                    overlap=min(70,end-start)
                    ramp=(.5-.5*np.cos(np.linspace(0,np.pi,overlap)))[None,:,None]
                    fill[:,start:start+overlap]=fill[:,start:start+overlap]*(1-ramp)+patch[:,:overlap]*ramp
                    fill[:,start+overlap:end]=patch[:,overlap:]
                else: fill[:,start:end]=patch
        else:
            fill=tex.copy()
        # Exclude contaminated boundary samples and use a narrow internal feather.
        weight=np.clip(distance_transform_edt(good)/12,0,1)[...,None]
        complete=tex*weight+fill*(1-weight)
        if name=='ideas': complete[:,:18]=tex[:,18:19]
        # Extend boundary colors to eliminate source/background seams.
        pad=9
        complete[:pad]=complete[pad]; complete[-pad:]=complete[-pad-1]
        complete[:,:pad]=complete[:,pad:pad+1]; complete[:,-pad:]=complete[:,-pad-1:-pad]
        save_rgb(LAYERS/f'{name}.png',complete)
        save_rgb(LAYERS/f'{name}_source_visibility.png',good*255)
        assets[name]=complete.astype(np.uint8)
    return assets

def prepare_background(im):
    # Model only smooth lighting; preserve the original clean border pixels exactly.
    y,x=np.mgrid[:NATIVE,:NATIVE].astype(float)
    xn=(x-627)/627; yn=(y-627)/627
    basis=np.stack([np.ones_like(xn),xn,yn,xn*xn,xn*yn,yn*yn],axis=-1)
    clean=(x<165)|(x>1100)|(y<125)|(y>1120)
    coeff=np.linalg.lstsq(basis[clean][::17],im[clean][::17],rcond=None)[0]
    fitted=basis@coeff
    weight=np.clip(distance_transform_edt(clean)/24,0,1)[...,None]
    bg=im*weight+fitted*(1-weight)
    save_rgb(LAYERS/'background.png',bg)

def assets_montage(assets):
    canvas=Image.new('RGB',(1500,900),'#dedbd5')
    draw=ImageDraw.Draw(canvas)
    for i,(name,tex) in enumerate(assets.items()):
        pic=Image.fromarray(tex); pic.thumbnail((345,825))
        canvas.paste(pic,(i*375+(375-pic.width)//2,45))
        draw.text((i*375+18,15),name,fill='black')
    canvas.save(HERE/'textures_contact_sheet.jpg',quality=95)

def multiband(a,b,weight,levels=5):
    ga=[a.astype(np.float32)]; gb=[b.astype(np.float32)]; gm=[weight.astype(np.float32)]
    for _ in range(levels):
        ga.append(cv2.pyrDown(ga[-1])); gb.append(cv2.pyrDown(gb[-1])); gm.append(cv2.pyrDown(gm[-1]))
    out=ga[-1]*gm[-1][...,None]+gb[-1]*(1-gm[-1][...,None])
    for i in range(levels-1,-1,-1):
        shape=(ga[i].shape[1],ga[i].shape[0])
        la=ga[i]-cv2.pyrUp(ga[i+1],dstsize=shape)
        lb=gb[i]-cv2.pyrUp(gb[i+1],dstsize=shape)
        out=cv2.pyrUp(out,dstsize=shape)+la*gm[i][...,None]+lb*(1-gm[i][...,None])
    return out

def prepare_mountain(im):
    # The related, already-existing editorial reference supplies a sharper hidden
    # ridge than the tiny mountain printed on home.png. Only hidden rock is repaired;
    # the visible home.png base remains the primary texture.
    donor=np.array(Image.open(SOURCE.with_name('graphic.png')).convert('RGB'))
    mat=cv2.getAffineTransform(np.float32([[523,681],[614,554],[799,661]]),
        np.float32([[346,845],[590,580],[915,932]]))
    ridge=cv2.warpAffine(donor,mat,(NATIVE,NATIVE),flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_REFLECT)
    ridgepath=[]
    for xx in range(523,800):
        column=donor[545:735,xx].mean(axis=1)
        solid=(column[:-3]<179)&(column[1:-2]<179)&(column[2:-1]<179)
        yy=545+np.flatnonzero(solid)[0]
        ridgepath.append([xx,yy+.55])
    top=np.c_[ridgepath,np.ones(len(ridgepath))]@mat.T
    # Join the reconstructed ridge to the original base contour, keeping its footprint.
    silhouette=[*top.tolist(),[916,943],[914,963],[922,984],[926,1008],
        [932,1030],[939,1049],[936,1056],[909,1065],[865,1076],[812,1084],
        [744,1088],[665,1086],[597,1087],[529,1086],[460,1082],[412,1071],
        [367,1055],[314,1040],[266,1022],[265,1017],[279,987],[306,948],
        [330,905],[342,877],[348,845]]
    alpha=polygon(silhouette,aa=4)
    # Trace unoccluded outer pixels directly where possible.
    y,x=np.mgrid[:NATIVE,:NATIVE]
    lum=im.mean(axis=2)
    basearea=(y>944)&(x>242)&(x<962)
    originalalpha=np.clip((226-lum)/28,0,1)
    # Remove detached anti-alias noise via a connected silhouette mask.
    alpha[basearea]=originalalpha[basearea]
    _,labels,stats,_=cv2.connectedComponentsWithStats((alpha>.12).astype(np.uint8))
    largest=1+np.argmax(stats[1:,cv2.CC_STAT_AREA])
    alpha*=labels==largest
    visible=(alpha>.98)&(y>778)
    for name in ['design','ideas','digital','stone']:
        cover=cv2.dilate((polygon(QUADS[name])>.01).astype(np.uint8),np.ones((11,11),np.uint8))
        visible &= cover==0
    # Keep the interpolation inside the rock; no background colors enter its edge.
    visible &= lum<217
    # Nearest valid base rock provides texture below the reconstructed peak crop.
    _, inds=distance_transform_edt(~visible,return_indices=True)
    nearest=im[inds[0],inds[1]].astype(float)
    upperweight=np.clip((985-y)/80,0,1)[...,None]
    replacement=ridge*upperweight+nearest*(1-upperweight)
    keep=np.clip(distance_transform_edt(visible)/22,0,1)
    tex=multiband(im,replacement,keep,levels=5)
    # Preserve uncontaminated original pixels away from the repaired boundary.
    exact=distance_transform_edt(visible)>55
    tex[exact]=im[exact]
    rgba=np.dstack([np.clip(tex,0,255),alpha*255])
    save_rgb(LAYERS/'mountain.png',rgba)
    save_rgb(LAYERS/'mountain_original_visibility.png',visible*255)
    bg=np.array(Image.open(LAYERS/'background.png')).astype(float)
    save_rgb(HERE/'mountain_reconstruction.jpg',tex*alpha[...,None]+bg*(1-alpha[...,None]))

def prepare():
    LAYERS.mkdir(parents=True,exist_ok=True)
    im=np.array(Image.open(SOURCE).convert('RGB'))
    assets=prepare_posters(im)
    prepare_background(im)
    prepare_mountain(im)
    assets_montage(assets)
    print('Prepared poster and background layers.',flush=True)

CAMERA={'focal':5000.0,'distance':5000.0,'elevation_deg':13.0,'cx':627.0,'cy':760.0}
RADIUS=350.0
ELEV=math.radians(CAMERA['elevation_deg'])
SIN_E=math.sin(ELEV); COS_E=math.cos(ELEV)

def project(world):
    world=np.asarray(world,float)
    depth=CAMERA['distance']-world[:,1]*SIN_E-world[:,2]*COS_E
    xy=np.column_stack([CAMERA['cx']+CAMERA['focal']*world[:,0]/depth,
        CAMERA['cy']-CAMERA['focal']*(world[:,1]*COS_E-world[:,2]*SIN_E)/depth])
    return xy,depth

def geometry(params, frame=0):
    angle,height,width,tall,offset=params
    angle=angle+2*np.pi*(frame%192)/192
    center=np.array([-RADIUS*np.sin(angle),height,RADIUS*np.cos(angle)])
    yaw=math.atan2(-center[0],CAMERA['distance']*COS_E-center[2])+offset
    right=np.array([math.cos(yaw),0,-math.sin(yaw)])
    up=np.array([0.,1.,0.])
    world=np.array([center-right*width/2+up*tall/2,
        center+right*width/2+up*tall/2,center+right*width/2-up*tall/2,
        center-right*width/2-up*tall/2])
    xy,depth=project(world)
    return xy,depth,world,center

def calibrate():
    result={}
    starts={'design':[160,200,560,630,40], 'ideas':[201,100,435,590,-39], 'digital':[293,100,265,525,-27]}
    anglebounds={'design':[115,179],'ideas':[181,240],'digital':[271,340]}
    for name,initial in starts.items():
        p=np.array(initial,float); p[[0,4]]=np.radians(p[[0,4]]); p[4]=np.clip(p[4],-.519,.519)
        target=np.array(QUADS[name],float)
        low=[np.radians(anglebounds[name][0]),-200,150,300,-.52]
        high=[np.radians(anglebounds[name][1]),700,1000,1000,.52]
        fit=least_squares(lambda v:(geometry(v)[0]-target).ravel(),p,bounds=(low,high),xtol=1e-12,ftol=1e-12,gtol=1e-12)
        result[name]={'parameters':fit.x.tolist(),'initial_quad_rms_px':float(np.sqrt(np.mean(fit.fun**2)))}
    # A flat source does not determine depth. Infer the nearest asymmetric angular
    # arrangement with enough clearance for every rigid plane over the entire turn.
    names=list(result)
    original_angles=np.array([result[name]['parameters'][0] for name in names])
    widths=np.array([result[name]['parameters'][2] for name in names])
    pairs=[(0,1),(0,2),(1,2)]
    def clearance(angles):
        return np.array([2*RADIUS*abs(np.sin((angles[i]-angles[j])/2))-(widths[i]+widths[j])/2-24 for i,j in pairs])
    fitted=minimize(lambda angles:np.sum((angles-original_angles)**2),original_angles,
        constraints=[{'type':'ineq','fun':clearance}],method='SLSQP',options={'ftol':1e-12,'maxiter':500})
    assert fitted.success and np.min(clearance(fitted.x))>-.001
    for i,name in enumerate(names):
        result[name]['source_fit_angle_deg']=float(np.degrees(original_angles[i]))
        result[name]['parameters'][0]=float(fitted.x[i])
        result[name]['safe_initial_angle_deg']=float(np.degrees(fitted.x[i]))
    config={'camera':CAMERA,'radius':RADIUS,'posters':result,
        'fps':24,'frames':192,'duration_seconds':8,'direction':'clockwise viewed from above; front travels screen-left',
        'orientation':'upright camera-facing with restrained constant oblique offset (at most 30 degrees)',
        'minimum_plane_clearance_world_units':float(clearance(fitted.x).min()+24),
        'reconstruction':'visible home.png pixels; hidden ridge from related source/graphic.png; fixed deterministic fills'}
    (HERE/'scene.json').write_text(json.dumps(config,indent=2),encoding='utf-8')
    print(json.dumps(result,indent=2),flush=True)
    return config

class Renderer:
    def __init__(self,size=2160):
        self.size=size; self.scale=size/NATIVE
        self.config=json.loads((HERE/'scene.json').read_text())
        self.textures={name:np.array(Image.open(LAYERS/f'{name}.png')).astype(np.float32)
            for name in ['design','ideas','digital','stone']}
        self.bg=cv2.resize(np.array(Image.open(LAYERS/'background.png')).astype(np.float32),(size,size),interpolation=cv2.INTER_CUBIC)
        self.rock=cv2.resize(np.array(Image.open(LAYERS/'mountain.png')).astype(np.float32),(size,size),interpolation=cv2.INTER_CUBIC)
        self.rock[:,:,3]=np.clip(self.rock[:,:,3],0,255)
        self.yy,self.xx=np.mgrid[:size,:size].astype(np.float32)
        # A fixed image-textured relief surface; the depth field is a triangulable
        # stationary mesh in camera coordinates. Narrow ridges recede naturally.
        native_x=self.xx/self.scale; native_y=self.yy/self.scale
        a=self.rock[:,:,3]/255
        left=np.zeros(size); right=np.zeros(size)
        for row in range(size):
            xs=np.flatnonzero(a[row]>.1)
            if len(xs): left[row]=xs[0]/self.scale; right[row]=xs[-1]/self.scale
        center=(left+right)/2; half=np.maximum((right-left)/2,1)
        horizontal=(native_x-center[:,None])/half[:,None]
        dome=np.sqrt(np.clip(1-horizontal**2,0,1))
        height=np.clip((native_y-570)/520,0,1)
        zrelief=235*dome*height**.65-80*(1-height)
        self.rock_depth=(CAMERA['distance']-zrelief).astype(np.float32)
        self.static_color=self.bg.copy(); self.static_depth=np.full((size,size),1e9,np.float32)
        stone_q=np.array(QUADS['stone'])*self.scale
        c,aa,d,box=self.warp_plane('stone',stone_q,np.full(4,5500.0))
        x0,y0,x1,y1=box
        self.static_color[y0:y1,x0:x1]=c+self.static_color[y0:y1,x0:x1]*(1-aa[...,None])
        self.static_depth[y0:y1,x0:x1]=np.where(aa>.1,d,1e9)
        self.behind_rock_color=self.static_color.copy()
        self.behind_rock_depth=self.static_depth.copy()
        # The opaque interior depth buffer prevents any object-order popping.
        self.static_color=self.rock[:,:,:3]*a[...,None]+self.static_color*(1-a[...,None])
        self.static_depth=np.where(a>.05,self.rock_depth,self.static_depth).astype(np.float32)
        self.fixed_hash=hashlib.sha256(self.static_color.tobytes()+self.static_depth.tobytes()).hexdigest()

    def warp_plane(self,name,quad,depths):
        tex=self.textures[name]; h,w=tex.shape[:2]
        x0=max(0,int(np.floor(quad[:,0].min()))-2); x1=min(self.size,int(np.ceil(quad[:,0].max()))+3)
        y0=max(0,int(np.floor(quad[:,1].min()))-2); y1=min(self.size,int(np.ceil(quad[:,1].max()))+3)
        local=(quad-[x0,y0]).astype(np.float32)
        mat=cv2.getPerspectiveTransform(np.float32([[0,0],[w-1,0],[w-1,h-1],[0,h-1]]),local)
        c=cv2.warpPerspective(tex,mat,(x1-x0,y1-y0),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
        aa=cv2.warpPerspective(np.ones((h,w),np.float32),mat,(x1-x0,y1-y0),flags=cv2.INTER_LINEAR)
        coefficients=np.linalg.lstsq(np.c_[quad,np.ones(4)],1/np.array(depths),rcond=None)[0]
        d=1/(coefficients[0]*self.xx[y0:y1,x0:x1]+coefficients[1]*self.yy[y0:y1,x0:x1]+coefficients[2])
        return c,aa,d,(x0,y0,x1,y1)

    def render(self,frame,output_size=1080,return_ids=False):
        back=self.behind_rock_color.copy(); back_depth=self.behind_rock_depth.copy()
        front=np.zeros_like(back); front_alpha=np.zeros_like(back_depth)
        front_depth=np.full_like(back_depth,1e9)
        ids=np.zeros((self.size,self.size),np.uint8) if return_ids else None
        planes=[]
        for number,(name,info) in enumerate(self.config['posters'].items(),1):
            q,d,world,center=geometry(info['parameters'],frame)
            planes.append((float(d.mean()),number,name,q*self.scale,d))
        # Far-to-near gives correct anti-aliased compositing; the per-pixel depth
        # buffer additionally handles planes whose depth ranges overlap.
        for _,number,name,q,d in sorted(planes,reverse=True):
            c,a,pdepth,box=self.warp_plane(name,q,d)
            x0,y0,x1,y1=box
            in_front=pdepth<self.rock_depth[y0:y1,x0:x1]
            for foreground,colorbuf,zbuf in [(False,back,back_depth),(True,front,front_depth)]:
                roi=colorbuf[y0:y1,x0:x1]; z=zbuf[y0:y1,x0:x1]
                win=(pdepth<z)&(a>0)&(in_front==foreground)
                roi[:]=np.where(win[...,None],c+roi*(1-a[...,None]),roi)
                z[:]=np.where(win&(a>.05),pdepth,z)
                if foreground:
                    fa=front_alpha[y0:y1,x0:x1]
                    fa[:]=np.where(win,a+fa*(1-a),fa)
                if ids is not None:
                    visible=win & (foreground | (self.rock[y0:y1,x0:x1,3]<128))
                    ids[y0:y1,x0:x1][visible]=number
        rock_alpha=self.rock[:,:,3:4]/255
        canvas=self.rock[:,:,:3]*rock_alpha+back*(1-rock_alpha)
        canvas=front+canvas*(1-front_alpha[...,None])
        if self.size!=output_size:
            canvas=cv2.resize(canvas,(output_size,output_size),interpolation=cv2.INTER_AREA)
        rgb=np.clip(np.rint(canvas),0,255).astype(np.uint8)
        return (rgb,ids) if return_ids else rgb

def contact():
    renderer=Renderer(1254)
    indices=list(range(0,192,16))
    sheet=Image.new('RGB',(4*400,3*427),'#dedbd5'); draw=ImageDraw.Draw(sheet)
    for k,n in enumerate(indices):
        frame=renderer.render(n,output_size=1080)
        Image.fromarray(frame).save(HERE/f'check_{n:03d}.jpg',quality=96)
        thumb=Image.fromarray(frame).resize((400,400),Image.Resampling.LANCZOS)
        x=(k%4)*400; y=(k//4)*427
        sheet.paste(thumb,(x,y+27)); draw.text((x+10,y+8),f'{n/24:.3f} s / frame {n}',fill='black')
    sheet.save(HERE/'orbit_contact_sheet.jpg',quality=96)
    print('Rendered full-orbit contact sheet.',flush=True)

def check_geometry():
    config=json.loads((HERE/'scene.json').read_text())
    max_radius_error=0.; max_length_error=0.; max_plane_error=0.; bounds=[]
    turns={}; centroids={}
    for name,info in config['posters'].items():
        params=info['parameters']; centers=[]; theta=[]
        for n in range(193):
            q,d,w,c=geometry(params,n)
            centers.append(c)
            theta.append(params[0]+2*np.pi*n/192)
            max_radius_error=max(max_radius_error,abs(np.linalg.norm(c[[0,2]])-RADIUS))
            max_length_error=max(max_length_error,abs(np.linalg.norm(w[1]-w[0])-params[2]),abs(np.linalg.norm(w[2]-w[1])-params[3]))
            max_plane_error=max(max_plane_error,abs(float(np.dot(np.cross(w[1]-w[0],w[3]-w[0]),w[2]-w[0])))/max(params[2]*params[3],1))
            bounds.append(q)
        step=np.diff(theta)
        assert np.allclose(step,2*np.pi/192,atol=1e-14)
        assert np.allclose(centers[0],centers[-1],atol=1e-12)
        turns[name]={'total_degrees':float(np.degrees(theta[-1]-theta[0])),
            'step_degrees_min':float(np.degrees(step).min()),'step_degrees_max':float(np.degrees(step).max()),
            'constant_world_speed_units_per_second':float(2*np.pi*RADIUS/8)}
        centroids[name]=np.array(centers)
    bounds=np.concatenate(bounds)
    assert bounds.min()>0 and bounds.max()<NATIVE
    assert max_radius_error<1e-9 and max_length_error<1e-9 and max_plane_error<1e-9
    names=list(centroids); minimum_clearance=1e9
    for i in range(3):
        for j in range(i+1,3):
            a=names[i]; b=names[j]
            horizontal=centroids[a][:,[0,2]]-centroids[b][:,[0,2]]
            margin=np.linalg.norm(horizontal,axis=1)-(config['posters'][a]['parameters'][2]+config['posters'][b]['parameters'][2])/2
            minimum_clearance=min(minimum_clearance,float(margin.min()))
    assert minimum_clearance>23.99
    return {'turns':turns,'max_radius_error':max_radius_error,'max_rigid_edge_length_error':max_length_error,
        'max_planarity_error':max_plane_error,'minimum_panel_clearance':minimum_clearance,
        'projected_source_bounds':[bounds.min(axis=0).tolist(),bounds.max(axis=0).tolist()],
        'camera_fixed':True,'background_fixed':True,'mountain_fixed':True,'stone_rectangle_fixed':True}

def encode():
    import imageio_ffmpeg
    ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
    report={'geometry':check_geometry()}
    renderer=Renderer(2160)
    output=HERE.parent/'mountain_orbit_loop_8s.mp4'
    args=[ffmpeg,'-hide_banner','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','1080x1080',
        '-framerate','24','-i','pipe:0','-an','-vf','scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p,setsar=1',
        '-c:v','libx264','-preset','slow','-crf','16','-r','24','-frames:v','192',
        '-video_track_timescale','12288','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',
        '-movflags','+faststart',str(output)]
    first=None; last=None; previous=None; diffs=[]; boundary_frames={}
    # Capture pixels which no moving poster covers, to verify the fixed layers.
    fixed_samples=[(30,30),(1060,30),(30,1060),(1060,1060),(540,927),(440,925),(650,925)]
    sample_values=[]
    with (HERE/'encoding.log').open('w',encoding='utf-8') as log:
        process=subprocess.Popen(args,stdin=subprocess.PIPE,stderr=log)
        try:
            for n in range(192):
                frame=renderer.render(n)
                if n==0: first=frame.copy()
                if previous is not None: diffs.append(float(np.mean(np.abs(frame.astype(float)-previous.astype(float)))))
                sample_values.append([frame[y,x].tolist() for x,y in fixed_samples])
                if n in [0,1,2,3,188,189,190,191]: boundary_frames[n]=frame.copy()
                if n in [0,24,48,72,96,120,144,168,191]:
                    Image.fromarray(frame).save(HERE/f'frame_{n:03d}.png')
                process.stdin.write(frame.tobytes())
                previous=frame; last=frame
                if n%24==0 or n==191: print(f'Rendered {n+1}/192 supersampled frames.',flush=True)
        finally:
            process.stdin.close()
        code=process.wait()
        if code: raise RuntimeError(f'FFmpeg failed ({code}); see encoding.log')
    endpoint=renderer.render(192)
    assert np.array_equal(endpoint,first),'Periodic endpoint is not pixel-identical.'
    assert not np.array_equal(last,first),'Duplicate terminal frame would create a pause.'
    wrap_diff=float(np.abs(last.astype(float)-first.astype(float)).mean())
    assert min(diffs)>0
    report['uncompressed_loop']={'endpoint_at_t8_matches_t0_pixel_exactly':True,'duplicate_terminal_frame':False,
        'last_to_first_mean_absolute_pixel_difference':wrap_diff,'first_to_second_difference':diffs[0],
        'penultimate_to_last_difference':diffs[-1], 'frame_difference_min':min(diffs),'frame_difference_max':max(diffs),
        'all_consecutive_frames_distinct':True}
    sample_values=np.array(sample_values)
    variations=np.ptp(sample_values,axis=0).max(axis=1)
    report['fixed_pixel_samples']=[{'xy':[x,y],'max_channel_variation':int(v)} for (x,y),v in zip(fixed_samples,variations)]
    assert np.all(variations==0),'A fixed sample moved or was unexpectedly covered.'
    assert renderer.fixed_hash==hashlib.sha256(renderer.static_color.tobytes()+renderer.static_depth.tobytes()).hexdigest()
    sheet=Image.new('RGB',(1440,390),'#eae7e1'); draw=ImageDraw.Draw(sheet)
    for i,n in enumerate([188,189,190,191,0,1,2,3]):
        x=i*180
        sheet.paste(Image.fromarray(boundary_frames[n]).resize((180,180),Image.Resampling.LANCZOS),(x,24))
        draw.text((x+7,7),f'Frame {n}',fill='black')
        crop=Image.fromarray(boundary_frames[n]).crop((365,370,725,730)).resize((180,180),Image.Resampling.LANCZOS)
        sheet.paste(crop,(x,210))
    sheet.save(HERE/'loop_boundary_contact_sheet.jpg',quality=97)
    (HERE/'verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(f'Encoded {output}',flush=True)
    verify()

def verify():
    import av
    import imageio_ffmpeg
    output=HERE.parent/'mountain_orbit_loop_8s.mp4'
    container=av.open(str(output))
    video=container.streams.video[0]
    timestamps=[]; decoded=0
    for frame in container.decode(video):
        timestamps.append(float(frame.pts*frame.time_base)); decoded+=1
    duration=float(video.duration*video.time_base)
    metadata={'codec':video.codec_context.name,'width':video.width,'height':video.height,
        'pixel_format':video.codec_context.format.name,'fps':str(video.average_rate),
        'declared_frames':video.frames,'decoded_frames':decoded,'duration_seconds':duration,
        'container_duration_seconds':container.duration/1e6,'audio_streams':len(container.streams.audio),
        'first_frame_timestamp':timestamps[0],'last_frame_timestamp':timestamps[-1],
        'constant_timestamp_step':bool(np.allclose(np.diff(timestamps),1/24,atol=1e-10))}
    assert metadata['codec']=='h264' and (video.width,video.height)==(1080,1080)
    assert video.average_rate==24 and video.frames==192 and decoded==192
    assert duration==8.0 and container.duration==8000000 and len(container.streams.audio)==0
    assert metadata['constant_timestamp_step'] and timestamps[0]==0
    container.close()
    report=json.loads((HERE/'verification.json').read_text())
    report['encoded_video']=metadata
    report['output_sha256']=hashlib.sha256(output.read_bytes()).hexdigest()
    report['output_size_bytes']=output.stat().st_size
    (HERE/'verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(output),'-vf','scale=540:540:flags=lanczos',
        '-an','-c:v','libx264','-crf','20','-preset','medium','-movflags','+faststart',str(HERE/'preview_540.mp4')],check=True)
    subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(output),'-filter_complex',
        'fps=12,scale=432:432:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=3',
        '-loop','0',str(HERE/'preview_432.gif')],check=True)
    print(json.dumps(metadata,indent=2),flush=True)

def finalize():
    """Independent post-render validation; also usable on an existing final encode."""
    report={'geometry':check_geometry()}
    small=Renderer(540)
    points=[(15,15),(530,15),(15,530),(530,530),(270,464),(220,463),(325,463)]
    diffs=[]; values=[]; first=None; previous=None
    for n in range(192):
        frame=small.render(n,540)
        if first is None: first=frame.copy()
        if previous is not None: diffs.append(float(np.abs(frame.astype(float)-previous.astype(float)).mean()))
        values.append([frame[y,x].tolist() for x,y in points])
        previous=frame
    assert np.array_equal(first,small.render(192,540))
    variations=np.ptp(np.array(values),axis=0).max(axis=1)
    assert np.all(variations==0)
    assert min(diffs)>0
    report['fixed_pixel_samples_540px']=[{'xy':[x,y],'max_channel_variation':int(v)} for (x,y),v in zip(points,variations)]
    report['full_orbit_540px_validation']={'all_192_frames_distinct':True,'min_adjacent_frame_difference':min(diffs),
        'max_adjacent_frame_difference':max(diffs),'last_to_first_difference':float(np.abs(previous.astype(float)-first.astype(float)).mean())}
    assert small.fixed_hash==hashlib.sha256(small.static_color.tobytes()+small.static_depth.tobytes()).hexdigest()
    del small
    large=Renderer(2160)
    frames={}
    for n in [188,189,190,191,0,1,2,3,192]: frames[n]=large.render(n)
    assert np.array_equal(frames[0],frames[192])
    assert not np.array_equal(frames[191],frames[0])
    def difference(a,b): return float(np.abs(frames[a].astype(float)-frames[b].astype(float)).mean())
    boundary=difference(191,0); before=difference(190,191); after=difference(0,1)
    assert abs(boundary/(.5*(before+after))-1)<.15
    report['uncompressed_loop']={'endpoint_at_t8_matches_t0_pixel_exactly':True,'duplicate_terminal_frame':False,
        'last_to_first_mean_absolute_pixel_difference':boundary,'first_to_second_difference':after,
        'penultimate_to_last_difference':before,'boundary_difference_relative_to_neighbors':boundary/(.5*(before+after))}
    assert large.fixed_hash==hashlib.sha256(large.static_color.tobytes()+large.static_depth.tobytes()).hexdigest()
    report['fixed_layer_sha256']=large.fixed_hash
    sheet=Image.new('RGB',(1440,390),'#eae7e1'); draw=ImageDraw.Draw(sheet)
    for i,n in enumerate([188,189,190,191,0,1,2,3]):
        x=i*180
        sheet.paste(Image.fromarray(frames[n]).resize((180,180),Image.Resampling.LANCZOS),(x,24))
        draw.text((x+7,7),f'Frame {n}',fill='black')
        crop=Image.fromarray(frames[n]).crop((365,370,725,730)).resize((180,180),Image.Resampling.LANCZOS)
        sheet.paste(crop,(x,210))
    sheet.save(HERE/'loop_boundary_contact_sheet.jpg',quality=97)
    (HERE/'verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('Independent source-frame checks passed.',flush=True)
    verify()

def mesh():
    """Export the fixed relief surface used by the compositor as a textured OBJ."""
    renderer=Renderer(NATIVE)
    np.save(LAYERS/'mountain_camera_depth.npy',renderer.rock_depth)
    lines=['mtllib mountain.mtl','o StationaryMountain','usemtl mountain']; lookup={}; coords=[]
    step=6
    for y in range(0,NATIVE,step):
        for x in range(0,NATIVE,step):
            if renderer.rock[y,x,3]<128: continue
            d=float(renderer.rock_depth[y,x]); vx=(x-CAMERA['cx'])*d/CAMERA['focal']
            up=(CAMERA['cy']-y)*d/CAMERA['focal']; toward=CAMERA['distance']-d
            wy=up*COS_E+toward*SIN_E; wz=-up*SIN_E+toward*COS_E
            lookup[(x,y)]=len(coords)+1; coords.append((x,y))
            lines.append(f'v {vx:.8f} {wy:.8f} {wz:.8f}')
    for x,y in coords: lines.append(f'vt {x/(NATIVE-1):.8f} {1-y/(NATIVE-1):.8f}')
    for x,y in coords:
        quad=[lookup.get((x,y)),lookup.get((x+step,y)),lookup.get((x+step,y+step)),lookup.get((x,y+step))]
        if all(quad):
            a,b,c,d=quad
            lines.append(f'f {a}/{a} {b}/{b} {c}/{c}')
            lines.append(f'f {a}/{a} {c}/{c} {d}/{d}')
    (LAYERS/'mountain.obj').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    (LAYERS/'mountain.mtl').write_text('newmtl mountain\nKd 1 1 1\nKa 1 1 1\nmap_Kd mountain.png\nmap_d mountain.png\n',encoding='utf-8')
    print(f'Exported mountain relief mesh: {len(coords)} vertices.',flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('command',choices=['prepare','calibrate','contact','encode','verify','finalize','mesh'])
    args=parser.parse_args()
    {'prepare':prepare,'calibrate':calibrate,'contact':contact,'encode':encode,'verify':verify,'finalize':finalize,'mesh':mesh}[args.command]()
