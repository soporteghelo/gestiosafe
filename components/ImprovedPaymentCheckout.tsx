import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

interface ImprovedPaymentCheckoutProps {
    preferenceId: string;
    publicKey: string;
    amount: number;
    appsScriptUrl: string;
    onPaymentResult: (result: any) => void;
    log: (msg: string) => void;
}

const ImprovedPaymentCheckout: React.FC<ImprovedPaymentCheckoutProps> = ({
    preferenceId,
    publicKey,
    amount,
    appsScriptUrl,
    onPaymentResult,
    log
}) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);

    useEffect(() => {
        if (!publicKey || publicKey.includes("YOUR_PUBLIC_KEY")) {
            const error = "❌ CLAVE PÚBLICA DE MERCADO PAGO NO CONFIGURADA";
            setInitError(error);
            log(error);
            onPaymentResult({
                status: 'error',
                error: {
                    message: error,
                    details: 'Configura VITE_MERCADOPAGO_PUBLIC_KEY en .env'
                }
            });
            return;
        }

        if (publicKey.startsWith("TEST-")) {
            const warning = "⚠️ Usando clave de prueba del sistema";
            log(warning);
        }

        try {
            initMercadoPago(publicKey, { locale: 'es-PE' });
            setIsInitialized(true);
            log("✅ SDK de Mercado Pago inicializado");
        } catch (error: any) {
            const errorMsg = `❌ Error al inicializar SDK: ${error.message}`;
            setInitError(errorMsg);
            log(errorMsg);
            onPaymentResult({ status: 'error', error });
        }
    }, [publicKey, log, onPaymentResult]);

    const customization = useMemo(() => ({
        visual: {
            style: {
                theme: 'default',
            },
        },
        paymentMethods: {
            maxInstallments: 1,
        },
    }), []);

    const handleSubmit = useCallback(async (param: any) => {
        try {
            log('📨 Pago enviado: ' + JSON.stringify(param));
            const { formData } = param;

            if (!formData) {
                throw new Error('Datos de formulario no disponibles');
            }

            const queryParams = new URLSearchParams({
                action: 'PROCESS_PAYMENT',
                token: formData.token || '',
                transaction_amount: String(formData.transaction_amount || 0),
                payment_method_id: formData.payment_method_id || '',
                installments: String(formData.installments || 1),
                issuer_id: formData.issuer_id || '',
                payer_email: formData.payer?.email || '',
                description: "Venta Gestiosafe"
            });

            log("🔄 Enviando al backend...");

            const response = await fetch(`${appsScriptUrl}?${queryParams.toString()}`, {
                method: 'GET',
                redirect: 'follow'
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const result = await response.json();
            log("✅ Respuesta del backend: " + JSON.stringify(result));

            if (result.status === 'SUCCESS' && result.payment?.status === 'approved') {
                log("🎉 PAGO APROBADO");
                onPaymentResult({ status: 'approved', details: result });
            } else if (result.status === 'SUCCESS' && result.payment?.status === 'in_process') {
                log("⏳ Pago en proceso");
                onPaymentResult({ status: 'pending', details: result });
            } else {
                const errorDetail = result.payment?.status_detail || result.message || 'Error desconocido';
                log(`❌ Pago rechazado: ${errorDetail}`);
                onPaymentResult({ status: 'rejected', error: result });
            }

        } catch (e: any) {
            const errorMsg = `❌ Error: ${e.message}`;
            log(errorMsg);
            onPaymentResult({ status: 'error', error: { message: e.message } });
        }
    }, [log, appsScriptUrl, onPaymentResult]);

    if (initError) {
        return (
            <div className="p-8 bg-red-50 border-2 border-red-200 rounded-3xl text-center">
                <p className="text-red-600 font-bold mb-4">{initError}</p>
                <p className="text-sm text-red-500">
                    Ve a tu panel de Mercado Pago y copia tu clave pública
                </p>
                <a
                    href="https://www.mercadopago.com.pe/developers/panel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-lg font-bold"
                >
                    Abrir Panel MP
                </a>
            </div>
        );
    }

    if (!isInitialized) {
        return (
            <div className="p-8 bg-blue-50 border-2 border-blue-200 rounded-3xl text-center">
                <p className="text-blue-600 font-bold animate-pulse">
                    Inicializando Mercado Pago...
                </p>
            </div>
        );
    }

    if (!preferenceId) {
        return (
            <div className="p-8 bg-yellow-50 border-2 border-yellow-200 rounded-3xl text-center">
                <p className="text-yellow-600 font-bold">
                    Generando preferencia de pago...
                </p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <Payment
                initialization={{
                    preferenceId: preferenceId,
                    amount: amount
                }}
                customization={customization as any}
                onSubmit={handleSubmit}
                onError={(error: any) => {
                    log('❌ Error en Payment Brick: ' + JSON.stringify(error));
                    onPaymentResult({ status: 'error', error });
                }}
                onReady={() => {
                    log("✅ Payment Brick listo");
                }}
            />
        </div>
    );
};

export default React.memo(ImprovedPaymentCheckout);
