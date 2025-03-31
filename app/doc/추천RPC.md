 create or replace function public.increment_votes(item_id_input bigint)
 returns void as $$
 begin
   update public.items
   set votes = votes + 1
   where id = item_id_input;
 end;
 $$ language plpgsql;


-- drop function if exists public.increment_votes(text);

create or replace function public.decrement_votes(item_id_input bigint)
returns void as $$
begin
  update public.items
  set votes = greatest(votes - 1, 0)
  where id = item_id_input;
end;
$$ language plpgsql;

