create schema if not exists private;
grant usage on schema private to authenticated, service_role;
alter function public.has_role(uuid, public.app_role) set schema private;
alter function public.is_admin(uuid) set schema private;
alter function public.is_approved_wholesale(uuid) set schema private;
grant execute on function private.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function private.is_admin(uuid) to authenticated, service_role;
grant execute on function private.is_approved_wholesale(uuid) to authenticated, service_role;