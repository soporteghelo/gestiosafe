import React, { useEffect, useRef, useState } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';

// URL del backend para procesar pagos
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzRt4zbQ0Eustfhv5dkVbS4hG4mGebASpuEXuDD2NgOp1txUM616nTQ_X7qVXcTpkLTZA/exec";

interface Props {
  publicKey: string;
  amount: number;
  currency: 'PEN' | 'USD';
  email: string;
  description: string;
  onPaymentResult: (result: any) => void;
  log: (msg: string) => void;
}

const CardPaymentCheckout: React.FC<Props> = ({ 
  publicKey, 
  amount, 
  currency,
  email, 
  description, 
  onPaymentResult, 
  log 
}) => {
  const [isReady, setIsReady] = useState(false);
  const sdkInitialized = useRef(false);
  
  // Refs para mantener valores actualizados sin causar re-renders
  const amountRef = useRef(amount);
  const currencyRef = useRef(currency);
  const emailRef = useRef(email);
  const descriptionRef = useRef(description);
  const onPaymentResultRef = useRef(onPaymentResult);
  const logRef = useRef(log);

  // Actualizar refs cuando cambien las props
  useEffect(() => {
    amountRef.current = amount;
    currencyRef.current = currency;
    emailRef.current = email;
    descriptionRef.current = description;
    onPaymentResultRef.current = onPaymentResult;
    logRef.current = log;
  });

  // Inicializar SDK solo una vez
  useEffect(() => {
    if (sdkInitialized.current) return;
    sdkInitialized.current = true;
    
    console.log('🔧 Inicializando Card Payment Brick...');
    console.log(`💰 Monto: ${currency} ${amount}`);
    
    initMercadoPago(publicKey, { locale: 'es-PE' });
    
    console.log('✅ SDK de Mercado Pago inicializado');
    setIsReady(true);
  }, []); // Sin dependencias - solo ejecutar una vez

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="size-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold">Inicializando SDK...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <CardPayment
        initialization={{ amount: amount }}
        customization={{
          visual: {
            style: {
              theme: 'default',
              customVariables: {
                formBackgroundColor: '#ffffff',
                baseColor: '#0066CC',
              }
            },
            hidePaymentButton: false,
          },
          paymentMethods: {
            maxInstallments: 12,
            minInstallments: 1,
          }
        } as any}
        onSubmit={async (param: any) => {
          const currentLog = logRef.current;
          const currentAmount = amountRef.current;
          const currentCurrency = currencyRef.current;
          const currentEmail = emailRef.current;
          const currentDescription = descriptionRef.current;
          const currentOnResult = onPaymentResultRef.current;
          
          currentLog('📤 Procesando pago con tarjeta...');
          const { formData } = param;
          currentLog(`Token generado: ${formData.token}`);
          
          try {
            const queryParams = new URLSearchParams({
              action: 'PROCESS_CARD_PAYMENT',
              token: formData.token,
              transaction_amount: currentAmount.toString(),
              payment_method_id: formData.payment_method_id || '',
              installments: (formData.installments || 1).toString(),
              issuer_id: (formData.issuer_id || '').toString(),
              payer_email: currentEmail,
              payer_identification_type: formData.payer?.identification?.type || 'DNI',
              payer_identification_number: formData.payer?.identification?.number || '12345678',
              description: currentDescription,
              currency_id: currentCurrency
            });

            currentLog("📡 Enviando pago al backend...");

            const response = await fetch(`${APPS_SCRIPT_URL}?${queryParams.toString()}`, {
              method: 'GET',
              redirect: 'follow'
            });
            
            const result = await response.json();
            currentLog(`📥 Respuesta: ${JSON.stringify(result)}`);
            
            if (result.status === 'approved') {
              currentLog('✅ ¡PAGO APROBADO!');
              currentOnResult({ status: 'approved', ...result });
            } else if (result.status === 'in_process' || result.status === 'pending') {
              currentLog('⏳ Pago en proceso/pendiente');
              currentOnResult({ status: 'pending', ...result });
            } else {
              currentLog(`❌ Pago rechazado: ${result.status_detail || result.message}`);
              currentOnResult({ status: 'error', error: result });
            }
          } catch (e: any) {
            currentLog(`❌ Error procesando pago: ${e.message}`);
            currentOnResult({ status: 'error', error: { message: e.message } });
          }
        }}
        onReady={() => {
          console.log('✅ Card Payment Brick listo');
          logRef.current('✅ Card Payment Brick listo para recibir pagos');
        }}
        onError={(error: any) => {
          console.error('❌ Error en Brick:', error);
          logRef.current(`❌ Error en Card Payment Brick: ${JSON.stringify(error)}`);
        }}
      />
    </div>
  );
};

export default React.memo(CardPaymentCheckout);
