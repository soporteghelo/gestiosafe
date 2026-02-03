import React, { useEffect, useCallback, useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

interface WalletPaymentCheckoutProps {
    preferenceId: string;
    publicKey: string;
    onPaymentResult: (result: any) => void;
    log: (msg: string) => void;
}

const WalletPaymentCheckout: React.FC<WalletPaymentCheckoutProps> = ({
    preferenceId,
    publicKey,
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
            log("✅ SDK de Mercado Pago inicializado (Wallet Brick)");
        } catch (error: any) {
            const errorMsg = `❌ Error al inicializar SDK: ${error.message}`;
            setInitError(errorMsg);
            log(errorMsg);
            onPaymentResult({ status: 'error', error });
        }
    }, [publicKey, log, onPaymentResult]);

    const handleError = useCallback((error: any) => {
        log('❌ Error en Wallet Brick: ' + JSON.stringify(error));
        onPaymentResult({ status: 'error', error });
    }, [log, onPaymentResult]);

    const handleReady = useCallback(() => {
        log("✅ Wallet Brick listo");
    }, [log]);

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
        <div className="w-full flex items-center justify-center min-h-[400px]">
            <Wallet
                initialization={{ preferenceId: preferenceId }}
                onReady={handleReady}
                onError={handleError}
            />
        </div>
    );
};

export default React.memo(WalletPaymentCheckout);
