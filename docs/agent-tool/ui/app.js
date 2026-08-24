const approval = document.querySelector('#approval');
const buttons = document.querySelectorAll('[data-action]');
const status = approval.querySelector('.status');
const title = approval.querySelector('h2');

function setDecision(action) {
  const states = {
    approve: ['GENEHMIGT', 'success'],
    reject: ['ABGELEHNT', 'pending'],
    override: ['CO-PILOT OVERRIDE', 'success']
  };
  const [label, tone] = states[action];
  status.textContent = label;
  status.className = `status ${tone}`;
  title.textContent = action === 'approve' ? 'Approval erteilt' : action === 'reject' ? 'Approval abgelehnt' : 'Co-Pilot Override erteilt';
  document.querySelector('#audit-id').textContent = `AUD-${Math.random().toString(16).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
}

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'focus-approval') {
      approval.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setDecision(action);
  });
});
