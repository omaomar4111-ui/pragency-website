// functions/api/admin/agent-actions/reject.js
import { onRequestPost as handlePost } from '../agent-actions.js';

export async function onRequestPost(context) {
  // Enforce action = 'reject'
  const originalJson = context.request.json.bind(context.request);
  context.request.json = async () => {
    const data = await originalJson().catch(() => ({}));
    data.action = 'reject';
    return data;
  };
  return handlePost(context);
}
