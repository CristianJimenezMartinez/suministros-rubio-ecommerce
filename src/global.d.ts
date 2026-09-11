// justo debajo de tus imports en payment.component.ts
declare global {
  interface Window {
    paypal: any;
    /**
     * getInSiteForm proporcionado por Redsys:
     * @param containerId id del div donde incrustar el iframe
     * @param estiloBoton CSS para el botón
     * @param estiloBody CSS para el body
     * @param estiloCaja CSS para la caja
     * @param estiloInputs CSS para los inputs
     * @param textoBoton Texto del botón de pago
     * @param fuc Código de comercio (merchantCode)
     * @param terminal Terminal
     * @param merchantOrder Identificador de pedido
     * @param idioma Código de idioma (ES, EN, ...)
     * @param logo Mostrar logo
     */
    getInSiteForm(
      containerId: string,
      estiloBoton: string,
      estiloBody: string,
      estiloCaja: string,
      estiloInputs: string,
      textoBoton: string,
      fuc: string,
      terminal: string,
      merchantOrder: string,
      idioma: string,
      logo: boolean
    ): void;
    /**
     * storeIdOper para capturar el idOper o error
     */
    storeIdOper(
      event: MessageEvent,
      tokenFieldId: string,
      errorFieldId: string,
      validateFn: () => boolean
    ): void;
  }
}
