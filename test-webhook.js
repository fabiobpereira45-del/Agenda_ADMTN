const url = 'https://agendaadmtn.app.n8n.cloud/webhook-test/agenda-preschedule';
const payload = {
    trigger_type: 'NEW_PRESCHEDULE',
    event_id: 999,
    title: 'Teste de Disparo',
    date: '2026-03-10',
    time: '19:00',
    applicant_name: 'Fábio Teste',
    applicant_phone: '(71) 98748-3103'
};
fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
}).then(r => r.json()).then(data => console.log(JSON.stringify(data, null, 2))).catch(e => console.error(e));
