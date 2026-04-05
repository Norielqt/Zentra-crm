const STATUS_CLASSES = {
  'New Lead':   'badge-new-lead',
  'Contacted':  'badge-contacted',
  'Qualified':  'badge-qualified',
  'Proposal':   'badge-proposal',
  'Closed':     'badge-closed',
  'To Do':      'badge-todo',
  'In Progress':'badge-inprogress',
  'Done':       'badge-done',
};

export default function Badge({ status }) {
  const cls = STATUS_CLASSES[status] || 'badge-todo';
  return <span className={`badge ${cls}`}>{status}</span>;
}
