import re

def update_file(filename, replacement_html):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Use regex to replace everything inside <main class="page-content"> ... </main>
    pattern = re.compile(r'<main class="page-content">.*?</main>', re.DOTALL)
    new_content = pattern.sub(replacement_html, content)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated {filename}")

web_dizajn = """<main class="page-content">
    <!-- HERO -->
    <section class="subpage-hero fade-in-up">
        <div class="breadcrumb">
            <a href="index.html">Pocetna</a> <span>/</span> <a href="usluga-web-dizajn.html">Usluge</a> <span>/</span> <strong style="color:var(--text-primary)">Web Dizajn</strong>
        </div>
        <h1>Web Dizajn <span class="highlight">(UI/UX)</span></h1>
        <p>Prava arhitektura za vrhunsko i besprijekorno korisnicko iskustvo koje donosi opipljive rezultate.</p>
    </section>

    <!-- FEATURES -->
    <section style="padding-top: 60px;">
        <div class="section-header fade-in">
            <h2>Što ukljucuje naša usluga</h2>
        </div>
        <div class="features-grid fade-in-up delay-1">
            <div class="feature-card">
                <i data-feather="layout" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--text-primary);">Dizajn</h3>
                <p>Moderan, cist i responzivan izgled (boje, raspored i tipografija) prilagoden svim uredajima.</p>
            </div>
            <div class="feature-card">
                <i data-feather="search" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--accent-color);">SEO Optimizacija</h3>
                <p>Tehnicka prilagodba stranice kako biste bili apsolutno vidljiviji i viši na Google tražilici.</p>
            </div>
            <div class="feature-card">
                <i data-feather="file-text" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--text-primary);">Sadržaj</h3>
                <p>Optimizirani tekstovi, slike i multimedija koji jasno komuniciraju vašu ponudu klijentima.</p>
            </div>
            <div class="feature-card">
                <i data-feather="compass" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--text-primary);">Navigacija</h3>
                <p>Intuitivni izbornici (UI/UX) kroz koje ce korisnici s lakocom pronaci sve što im je potrebno.</p>
            </div>
            <div class="feature-card">
                <i data-feather="shield" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--text-primary);">Sigurnost</h3>
                <p>Napredna zaštita podataka i SSL certifikati za dugorocnu sigurnost vaših korisnika.</p>
            </div>
            <div class="feature-card">
                <i data-feather="server" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--text-primary);">Domena i Hosting</h3>
                <p>Odabir idealnog naziva te postavljanje stabilnog temelja na brzim i sigurnim serverima.</p>
            </div>
        </div>
    </section>

    <!-- PROCESS -->
    <section>
        <div class="section-header fade-in">
            <h2>Naš Proces</h2>
        </div>
        <div class="process-mini fade-in-up delay-1">
            <div class="step-mini">
                <div class="step-number">01</div>
                <h4>PLANIRANJE</h4>
                <p>Istraživanje vaše niše, konkurencije i postavljanje wireframe temelja.</p>
            </div>
            <div class="step-mini">
                <div class="step-number">02</div>
                <h4>DIZAJN</h4>
                <p>Razrada boja, tipografije i korisnickog sucelja (UI) do najsitnijeg detalja.</p>
            </div>
            <div class="step-mini">
                <div class="step-number">03</div>
                <h4>LANSIRANJE</h4>
                <p>Programiranje, finalno testiranje na uredajima i puštanje u rad.</p>
            </div>
        </div>
    </section>

    <!-- MODERN CTA -->
    <section class="fade-in">
        <div class="modern-cta">
            <div class="modern-cta-content">
                <h2 style="color: var(--text-primary);">Zapocnite svoju digitalnu transformaciju</h2>
                <p>Javite nam se s detaljima vašeg projekta i dobit cete besplatnu procjenu i savjet.</p>
                <a href="kontakt.html" class="btn btn-primary btn-large magnetic">Zatraži procjenu projekta</a>
            </div>
        </div>
    </section>
</main>"""

graficki_dizajn = """<main class="page-content">
    <section class="subpage-hero fade-in-up">
        <div class="breadcrumb">
            <a href="index.html">Pocetna</a> <span>/</span> <a href="usluga-graficki-dizajn.html">Usluge</a> <span>/</span> <strong style="color:var(--text-primary)">Graficki Dizajn</strong>
        </div>
        <h1>Graficki <span class="highlight">Dizajn</span></h1>
        <p>Stvaranje snažnog i dosljednog vizualnog identiteta koji ce vas izdvojiti iznad svake konkurencije.</p>
    </section>

    <section style="padding-top: 60px;">
        <div class="section-header fade-in">
            <h2>Što ukljucuje naša usluga</h2>
        </div>
        <div class="features-grid fade-in-up delay-1">
            <div class="feature-card">
                <i data-feather="pen-tool" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--text-primary);">Izrada Logotipa</h3>
                <p>Prepoznatljiv i moderan znak koji predstavlja samu srž vašeg brendinga i vrijednosti tvrtke.</p>
            </div>
            <div class="feature-card">
                <i data-feather="book-open" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--text-primary);">Knjiga Standarda</h3>
                <p>Pravila o korištenju tipografije, boja i logotipa kroz kompletan službeni Brand Book.</p>
            </div>
            <div class="feature-card">
                <i data-feather="instagram" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--text-primary);">Vizuali za Mreže</h3>
                <p>Dizajn atraktivnih objava i cover slika za društvene mreže kako biste zadržali profesionalnost.</p>
            </div>
            <div class="feature-card">
                <i data-feather="file" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--text-primary);">Memorandumi</h3>
                <p>Profesionalni digitalni i fizicki predlošci za vaše ponude, ugovore, racune i službene dopise.</p>
            </div>
            <div class="feature-card">
                <i data-feather="briefcase" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--text-primary);">Vizitke</h3>
                <p>Moderne i vizualno upecatljive posjetnice (vizitke) koje ostavljaju savršen prvi dojam uživo.</p>
            </div>
            <div class="feature-card">
                <i data-feather="printer" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--text-primary);">Tiskani Materijali</h3>
                <p>Dizajn plakata, brošura, letaka i roll-up bannera spremnih za kvalitetan i profesionalni tisak.</p>
            </div>
        </div>
    </section>

    <section>
        <div class="section-header fade-in">
            <h2>Naš Proces</h2>
        </div>
        <div class="process-mini fade-in-up delay-1">
            <div class="step-mini">
                <div class="step-number">01</div>
                <h4>PLANIRANJE</h4>
                <p>Slušanje vaše vizije i detaljno analiziranje vizualne pozicije vašeg brenda na tržištu.</p>
            </div>
            <div class="step-mini">
                <div class="step-number">02</div>
                <h4>KREATIVNI KONCEPT</h4>
                <p>Skiciranje, isprobavanje više smjerova dizajna te usuglašavanje i odabir najboljeg rješenja.</p>
            </div>
            <div class="step-mini">
                <div class="step-number">03</div>
                <h4>FINALIZACIJA</h4>
                <p>Izrada svih formata te isporuka materijala spremnih za tisak i digitalno web korištenje.</p>
            </div>
        </div>
    </section>

    <section class="fade-in">
        <div class="modern-cta">
            <div class="modern-cta-content">
                <h2 style="color: var(--text-primary);">Ostavite neizbrisiv trag</h2>
                <p>Javite nam se s detaljima vašeg brenda i zatražite vrhunski dizajn identiteta.</p>
                <a href="kontakt.html" class="btn btn-primary btn-large magnetic">Zatraži dizajn identiteta</a>
            </div>
        </div>
    </section>
</main>"""

digitalni_proizvodi = """<main class="page-content">
    <section class="subpage-hero fade-in-up">
        <div class="breadcrumb">
            <a href="index.html">Pocetna</a> <span>/</span> <a href="usluga-digitalni-proizvodi.html">Usluge</a> <span>/</span> <strong style="color:var(--text-primary)">Digitalni Proizvodi</strong>
        </div>
        <h1>Digitalni <span class="highlight">Proizvodi</span></h1>
        <p>Pretvaranje kompleksnih poslovnih sustava i procesa u jednostavno i iznimno ugodno korisnicko iskustvo.</p>
    </section>

    <section style="padding-top: 60px;">
        <div class="section-header fade-in">
            <h2>Što ukljucuje naša usluga</h2>
        </div>
        <div class="features-grid fade-in-up delay-1">
            <div class="feature-card">
                <i data-feather="smartphone" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--text-primary);">Mobilne Aplikacije</h3>
                <p>Inovativan UI/UX dizajn nativnih i cross-platform aplikacija za iOS i Android sustave.</p>
            </div>
            <div class="feature-card">
                <i data-feather="monitor" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--text-primary);">SaaS Platforme</h3>
                <p>Dizajn naprednih softverskih rješenja u oblaku baziranih na pretplati i pristupu kroz web.</p>
            </div>
            <div class="feature-card">
                <i data-feather="grid" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--text-primary);">Admin Sucelja</h3>
                <p>Pregledna i responzivna kontrolna ploca (dashboards) za lako upravljanje bazama i podacima.</p>
            </div>
            <div class="feature-card">
                <i data-feather="git-merge" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--text-primary);">Analiza Procesa</h3>
                <p>Dubinsko istraživanje tehnickih procesa i kreiranje savršenih logicnih korisnickih tokova i puteva.</p>
            </div>
            <div class="feature-card">
                <i data-feather="users" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--text-primary);">A/B Testiranje</h3>
                <p>Eksperimentalno testiranje dvaju verzija dizajna kako bi osigurali izvanrednu konverziju i efikasnost.</p>
            </div>
            <div class="feature-card">
                <i data-feather="check-circle" class="feature-icon" style="width: 32px; height: 32px;"></i>
                <h3 style="color: var(--text-primary);">Korisnicka Validacija</h3>
                <p>Sustavno testiranje prvih prototipa sa stvarnim potencijalnim korisnicima kako bi sprijecili greške.</p>
            </div>
        </div>
    </section>

    <section>
        <div class="section-header fade-in">
            <h2>Naš Proces</h2>
        </div>
        <div class="process-mini fade-in-up delay-1">
            <div class="step-mini">
                <div class="step-number">01</div>
                <h4>PLANIRANJE</h4>
                <p>Definiranje svih funkcija, izrada user flow-a i wireframe shematske arhitekture kompleksnog sustava.</p>
            </div>
            <div class="step-mini">
                <div class="step-number">02</div>
                <h4>PROTOTIPIRANJE</h4>
                <p>High-fidelity interaktivni dizajn zaslona gdje osiguravamo besprijekoran i moderan vizualni UX/UI.</p>
            </div>
            <div class="step-mini">
                <div class="step-number">03</div>
                <h4>DEPLOYMENT</h4>
                <p>Olakšavanje razvoja inženjerima, beta testiranje grešaka, pracenje metrika i puštanje aplikacije u svijet.</p>
            </div>
        </div>
    </section>

    <section class="fade-in">
        <div class="modern-cta">
            <div class="modern-cta-content">
                <h2 style="color: var(--text-primary);">Izgradite skalabilan proizvod</h2>
                <p>Vaša ideja za aplikaciju ili platformu treba uvjerljivo najbolji dizajn kako bi uspjela. Obratite nam se!</p>
                <a href="kontakt.html" class="btn btn-primary btn-large magnetic">Zatraži ponudu za svoj app</a>
            </div>
        </div>
    </section>
</main>"""

update_file('usluga-web-dizajn.html', web_dizajn)
update_file('usluga-graficki-dizajn.html', graficki_dizajn)
update_file('usluga-digitalni-proizvodi.html', digitalni_proizvodi)

print("Updated HTML logic with new design!")
