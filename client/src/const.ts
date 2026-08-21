/** Customer accounts are disabled in the self-hosted build. */
export const startLogin = () => {
  if (typeof window !== "undefined") {
    window.location.assign("/rastrear-pedido");
  }
};
