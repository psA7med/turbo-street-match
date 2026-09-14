CREATE POLICY applications_own_reapply ON public.wholesale_applications
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND status = 'rejected'::application_status)
WITH CHECK (user_id = auth.uid() AND status = 'pending'::application_status);