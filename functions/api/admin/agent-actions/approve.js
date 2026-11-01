// functions/api/admin/agent-actions/approve.js
import { onRequestPost as handlePost } from '../agent-actions.js';

export async function onRequestPost(context) {
  // Enforce action = 'approve'
  const originalJson = context.request.json.bind(context.request);
  context.request.json = async () => {
    const data = await originalJson().catch(() => ({}));
    data.action = 'approve';
    return data;
  };
  return handlePost(context);
}
