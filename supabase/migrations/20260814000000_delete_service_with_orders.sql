-- =============================================================================
-- Delete a service together with every order that referenced it
-- Purpose: Hard delete services that already have order history. Previously
--          such services were only archived because order_items.service_id is
--          ON DELETE RESTRICT. This RPC removes the service AND every order
--          (with its payment transactions and checkout sessions) in one
--          transaction so no orphaned history remains.
-- Date: 2026-08-14
-- =============================================================================

CREATE OR REPLACE FUNCTION public.delete_service_with_orders(p_service_id uuid)
RETURNS TABLE (deleted_orders bigint, deleted_transactions bigint, deleted_sessions bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_ids uuid[];
  v_session_ids text[];
BEGIN
  -- Collect every order that ever contained an item for this service.
  SELECT ARRAY_AGG(DISTINCT oi.order_id)
    INTO v_order_ids
    FROM order_items oi
   WHERE oi.service_id = p_service_id;

  IF v_order_ids IS NULL THEN
    DELETE FROM services WHERE id = p_service_id;
    deleted_orders := 0;
    deleted_transactions := 0;
    deleted_sessions := 0;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Collect the checkout sessions of those orders (needed after orders are gone).
  SELECT ARRAY_AGG(DISTINCT checkout_session_id)
    INTO v_session_ids
    FROM orders
   WHERE id = ANY(v_order_ids);

  -- Transactions first: they reference checkout_sessions ON DELETE RESTRICT.
  DELETE FROM transactions
   WHERE checkout_session_id = ANY(v_session_ids);
  GET DIAGNOSTICS deleted_transactions = ROW_COUNT;

  -- Orders next; order_items cascade from orders, support_tickets.order_id
  -- is set to NULL by its ON DELETE SET NULL constraint.
  DELETE FROM orders
   WHERE id = ANY(v_order_ids);
  GET DIAGNOSTICS deleted_orders = ROW_COUNT;

  -- Sessions and their carts (carts cascade to cart_items).
  DELETE FROM checkout_sessions
   WHERE id = ANY(v_session_ids);
  GET DIAGNOSTICS deleted_sessions = ROW_COUNT;

  DELETE FROM services
   WHERE id = p_service_id;

  RETURN NEXT;
END;
$$;

-- Only the server (service role) may run this destructive operation.
REVOKE ALL ON FUNCTION public.delete_service_with_orders(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_service_with_orders(uuid) TO service_role;
