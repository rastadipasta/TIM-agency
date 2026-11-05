export class SubmissionError extends Error {
  constructor(message, { status = 0, fields = {}, uncertain = false } = {}) {
    super(message); this.name = 'SubmissionError'; this.status = status; this.fields = fields; this.uncertain = uncertain;
  }
}
export function createSender({ fetchImpl = globalThis.fetch, endpoint = '/api/contact', timeoutMs = 20000 } = {}) {
  let sending = false;
  return {
    get sending() { return sending; },
    async send(payload) {
      if (sending) throw new SubmissionError('An enquiry is already being sent. Please wait.');
      sending = true;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(endpoint, { method:'POST', headers:{'Content-Type':'application/json',Accept:'application/json'}, body:JSON.stringify(payload), signal:controller.signal });
        const result = await response.json().catch(() => null);
        if (!response.ok || result?.ok !== true) {
          throw new SubmissionError(response.status === 429 ? 'Too many attempts. Wait a few minutes before trying again.' : 'Your enquiry was not sent. Please check your details or contact us by email.', { status:response.status, fields:result?.errors || {} });
        }
        return result;
      } catch (error) {
        if (error instanceof SubmissionError) throw error;
        if (error.name === 'AbortError') throw new SubmissionError('We could not confirm receipt. Please check before sending again, or contact us by email.', { uncertain:true });
        throw new SubmissionError('Sending is unavailable. Your answers are still here. Download a copy or prepare an email.', { uncertain:true });
      } finally { clearTimeout(timeout); sending = false; }
    }
  };
}
