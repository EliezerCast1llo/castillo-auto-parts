-- PostgreSQL requires a newly added enum value to be committed before it is
-- referenced by a column default. The remaining changes live in the next
-- migration for that reason.
ALTER TYPE "OrderStatus" ADD VALUE 'PAYMENT_PROCESSING';
