-- Allow admins to manage products
CREATE POLICY "Admins can insert products" 
ON public.products 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products" 
ON public.products 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products" 
ON public.products 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view and update all orders
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders" 
ON public.orders 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));