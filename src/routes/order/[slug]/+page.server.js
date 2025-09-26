import { error } from "@sveltejs/kit";

export const load = ({ params }) => {
  return {
    order_id: params.slug,
  };

  error(404, "Not found");
};
