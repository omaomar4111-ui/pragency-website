import { onRequestGet, onRequestPut, onRequestDelete } from '../members.js';

export async function onRequest(context) {
  const { request, params } = context;
  const id = params.id;
  const url = new URL(request.url);
  url.searchParams.set('id', id);

  const newRequest = new Request(url.toString(), request);
  const newContext = { ...context, request: newRequest };

  if (request.method === 'GET') return onRequestGet(newContext);
  if (request.method === 'PUT') return onRequestPut(newContext);
  if (request.method === 'DELETE') return onRequestDelete(newContext);

  return new Response('Method Not Allowed', { status: 405 });
}
