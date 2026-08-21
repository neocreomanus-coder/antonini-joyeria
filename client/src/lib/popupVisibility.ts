export function shouldHideWelcomePopup(pathname: string) {
  return pathname.startsWith("/admin")
    || pathname === "/checkout"
    || pathname.startsWith("/pago/")
    || pathname.startsWith("/pedido-confirmado/")
    || pathname === "/rastrear-pedido";
}
