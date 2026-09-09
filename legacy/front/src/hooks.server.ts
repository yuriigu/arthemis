import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    if (!event.url.pathname.startsWith('/login')) {
        const token = event.cookies.get('arthemis_token');

        if (!token) {
          redirect(303, '/login');
        }

        event.locals.token = token;
    } 
    
    const response = await resolve(event);
    return response;
}
