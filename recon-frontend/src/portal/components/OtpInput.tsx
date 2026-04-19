import { useEffect, useMemo, useRef } from 'react';

interface OtpInputProps {
    value: string;
    onChange: (next: string) => void;
    disabled?: boolean;
    error?: boolean;
    success?: boolean;
}

const OTP_LENGTH = 8;

export default function OtpInput({ value, onChange, disabled, error, success }: OtpInputProps) {
    const refs = useRef<Array<HTMLInputElement | null>>([]);

    const chars = useMemo(() => {
        const clean = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
        return Array.from({ length: OTP_LENGTH }, (_, idx) => clean[idx] ?? '');
    }, [value]);

    useEffect(() => {
        refs.current[0]?.focus();
    }, []);

    const updateIndex = (index: number, char: string) => {
        const nextChars = [...chars];
        nextChars[index] = char;
        onChange(nextChars.join(''));
    };

    return (
        <div className={`w-full max-w-[25rem] mx-auto grid grid-cols-8 items-center gap-1 sm:gap-2 ${error ? 'otp-shake' : ''}`}>
            {chars.map((char, index) => (
                <input
                    key={index}
                    ref={(node) => {
                        refs.current[index] = node;
                    }}
                    value={char}
                    disabled={disabled}
                    maxLength={1}
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    className={`w-full max-w-11 h-11 sm:h-[52px] justify-self-center border bg-[var(--bg)] text-center font-portal-display text-[22px] sm:text-[28px] leading-none text-[var(--fg)] outline-none transition-colors focus:border-[var(--amber)] ${
                        success
                            ? 'border-[var(--portal-green)]'
                            : error
                              ? 'border-[var(--portal-red)]'
                              : 'border-[var(--border-dim)]'
                    }`}
                    style={{ boxShadow: '0 0 0 1px color-mix(in srgb, var(--amber) 0%, transparent)' }}
                    onFocus={(event) => event.currentTarget.select()}
                    onChange={(event) => {
                        const next = event.target.value.replace(/\D/g, '').slice(-1);
                        updateIndex(index, next);
                        if (next && index < OTP_LENGTH - 1) {
                            refs.current[index + 1]?.focus();
                        }
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Backspace') {
                            if (chars[index]) {
                                updateIndex(index, '');
                                return;
                            }
                            if (index > 0) {
                                refs.current[index - 1]?.focus();
                                updateIndex(index - 1, '');
                            }
                        }
                        if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
                        if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
                    }}
                    onPaste={(event) => {
                        event.preventDefault();
                        const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
                        if (!pasted) return;
                        onChange(pasted);
                        const targetIndex = Math.min(pasted.length, OTP_LENGTH - 1);
                        refs.current[targetIndex]?.focus();
                    }}
                />
            ))}
        </div>
    );
}
