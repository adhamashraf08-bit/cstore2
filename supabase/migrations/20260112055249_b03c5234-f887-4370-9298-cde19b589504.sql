-- Add INSERT policy - only the trigger function can insert (via SECURITY DEFINER)
-- Users cannot directly insert roles
CREATE POLICY "Prevent direct role inserts"
ON public.user_roles
FOR INSERT
WITH CHECK (false);

-- Add UPDATE policy - only admins can update roles
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add DELETE policy - only admins can delete roles
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);