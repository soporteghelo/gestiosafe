import React, { useEffect, useCallback, useMemo } from 'react';
import { initMercadoPago, Payment, CardPayment } from '@mercadopago/sdk-react';

interface MercadoPagoCheckoutProps {
    preferenceId: string;
    publicKey: string;
    appsScriptUrl: string;
    amount: number;
    onPaymentResult: (result: any) => void;
    log: (msg: string) => void;
}

const MercadoPagoCheckout: React.FC<MercadoPagoCheckoutProps> = ({ preferenceId, publicKey, appsScriptUrl, amount, onPaymentResult, log }) => {

    useEffect(() => {
        if (publicKey) {
            initMercadoPago(publicKey, { locale: 'es-PE' });
        }
    }, [publicKey]);

    const customization: any = useMemo(() => ({
        visual: {
            style: {
                theme: 'default',
            },
            hidePaymentButton: false,
        },
        paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
            maxInstallments: 1,
        },
    }), []);

    const handleSubmit = useCallback(async (param: any) => {
        log('Payment submitted raw: ' + JSON.stringify(param));
        const { formData } = param;

        try {
            const queryParams = new URLSearchParams({
                action: 'PROCESS_PAYMENT',
                token: formData.token,
                transaction_amount: formData.transaction_amount,
                payment_method_id: formData.payment_method_id,
                installments: formData.installments,
                issuer_id: formData.issuer_id,
                payer_email: formData.payer.email,
                description: "Venta Gestiosafe"
            });

            log("Enviando a procesar a backend...");

            const response = await fetch(`${appsScriptUrl}?${queryParams.toString()}`, {
                method: 'GET',
                redirect: 'follow'
            });

            const result = await response.json();
            log("Respuesta Backend: " + JSON.stringify(result));

            if (result.status === 'SUCCESS' && result.payment && result.payment.status === 'approved') {
                onPaymentResult({ status: 'approved', details: result });
            } else if (result.status === 'SUCCESS' && result.payment && result.payment.status === 'in_process') {
                onPaymentResult({ status: 'pending', details: result });
            } else {
                onPaymentResult({ status: 'rejected', error: result });
            }

        } catch (e: any) {
            log("Error procesando pago: " + e.toString());
            onPaymentResult({ status: 'error', error: e.toString() });
        }

    }, [log, appsScriptUrl, onPaymentResult]);

    const handleReady = useCallback(() => {
        console.log("Payment Brick ready");
    }, []);

    const handleError = useCallback((error: any) => {
        log('❌ Payment Brick error: ' + JSON.stringify(error));
        onPaymentResult({ status: 'error', error });
    }, [log, onPaymentResult]);

    if (!preferenceId || !publicKey) {
        return <div className="p-4 text-center text-slate-500">Cargando configuración de pago...</div>;
    }

    return (
        <div className="w-full">
            <CardPayment
                initialization={{ amount: amount }}
                customization={{
                    visual: { hidePaymentButton: false },
                    paymentMethods: {
                        maxInstallments: 1
                    }
                } as any}
                onSubmit={handleSubmit}
                onReady={handleReady}
                onError={handleError}
            />
        </div>
    );
};

export default React.memo(MercadoPagoCheckout);
