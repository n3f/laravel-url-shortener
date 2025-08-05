import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ShortUrlFormProps {
    className?: string;
}

interface FormData {
    url?: string;
    alias?: string;
    expires_at?: string;
}

type FormErrors = { [K in keyof FormData]?: string } & { [key: string]: string | undefined };

export function ShortUrlForm({ className }: ShortUrlFormProps) {
    const [formData, setFormData] = useState<FormData>({});
    const [showExpiration, setShowExpiration] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationTimeouts, setValidationTimeouts] = useState<Record<string, NodeJS.Timeout>>({});

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            Object.values(validationTimeouts).forEach(timeout => clearTimeout(timeout));
        };
    }, [validationTimeouts]);

    const validateUrl = (url: string): string | undefined => {
        if (!url.trim()) {
            return 'URL is required';
        }

        const trimmedUrl = url.trim();

        try {
            // If no protocol, prepend http:// for validation
            // const urlToValidate = trimmedUrl.includes('://') ? trimmedUrl : `http://${trimmedUrl}`;
            new URL(trimmedUrl);
        } catch {
            return 'Please enter a valid URL';
        }

        return undefined;
    };

    const validateAlias = (alias: string): string | undefined => {
        if (!alias.trim()) {
            return undefined; // Alias is optional
        }

        if (alias.length > 30) {
            return 'Alias must be 30 characters or less';
        }

        if (!/^[a-zA-Z0-9-]+$/.test(alias)) {
            return 'Alias can only contain letters, numbers, and hyphens';
        }

        return undefined;
    };

    const validateExpiration = (expires_at: string): string | undefined => {
        if (!expires_at.trim()) {
            return undefined; // Expiration is optional
        }

        const expirationDate = new Date(expires_at);
        const now = new Date();

        if (isNaN(expirationDate.getTime())) {
            return 'Please enter a valid date';
        }

        if (expirationDate <= now) {
            return 'Expiration date must be in the future';
        }

        return undefined;
    };

    const debouncedValidation = (field: 'url' | 'alias' | 'expires_at', value: string) => {
        const timeoutId = setTimeout(() => {
            let error: string | undefined;

            if (field === 'url') {
                error = validateUrl(value);
            } else if (field === 'alias') {
                error = validateAlias(value);
            } else if (field === 'expires_at') {
                error = validateExpiration(value);
            }

            setErrors(prev => ({ ...prev, [field]: error }));
        }, 500);

        return timeoutId;
    };

    const handleInputChange = (field: 'url' | 'alias' | 'expires_at', value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear existing timeout for this field
        if (validationTimeouts[field]) {
            clearTimeout(validationTimeouts[field]);
        }

        // Clear any server side errors
        setErrors(prev => {
            const { alias, url, expires_at } = prev;
            return { alias, url, expires_at };
        });

        // Debounced validation
        const timeoutId = debouncedValidation(field, value);
        setValidationTimeouts(prev => ({ ...prev, [field]: timeoutId }));
    };

    const handleExpirationToggle = (checked: boolean) => {
        setShowExpiration(checked);
        if (!checked) {
            setFormData(prev => ({ ...prev, expires_at: undefined }));
            setErrors(prev => ({ ...prev, expires_at: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Final validation before submission
        const urlError = validateUrl(formData.url || '');
        const aliasError = validateAlias(formData.alias || '');
        const expirationError = showExpiration ? validateExpiration(formData.expires_at || '') : undefined;

        if (urlError || aliasError || expirationError) {
            setErrors({ url: urlError, alias: aliasError, expires_at: expirationError });
            return;
        }

        setIsSubmitting(true);

        try {
            const payload: Record<string, string> = {
                url: formData.url?.trim() || '',
            };

            if (formData.alias?.trim()) {
                payload.short_code = formData.alias.trim();
            }

            if (showExpiration && formData.expires_at?.trim()) {
                const localDate = new Date(formData.expires_at);
                payload.expires_at = localDate.toISOString();
            }

            // Submit to backend
            router.post('/api/urls', payload, {
                onSuccess: () => {
                    // Reset form on success
                    setFormData({});
                    setShowExpiration(false);
                    setErrors({});
                },
                onError: (errors: Record<string, string>) => {
                    // Handle validation errors from backend
                    setErrors(errors);
                },
            });
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasErrors = Object.values(errors).some(error => error !== undefined);

    return (
        <div className={`${className} flex items-center justify-center min-h-full w-full`}>
            <form onSubmit={handleSubmit} className="w-full" noValidate>
                <div className="grid grid-cols-12 gap-4" style={{ gridTemplateRows: showExpiration ? 'auto auto auto' : 'auto auto' }}>
                    {/* General errors not tied to specific form fields */}
                    {Object.entries(errors)
                        .filter(([key]) => !['url', 'alias', 'expires_at'].includes(key))
                        .map(([key, value]) => (
                            <div key={key} className="col-span-12">
                                <Alert variant="destructive">
                                    <AlertDescription>{value}</AlertDescription>
                                </Alert>
                            </div>
                        ))}

                    {/* URL Error */}
                    {errors.url && (
                        <div className="col-span-12">
                            <Alert variant="destructive">
                                <AlertDescription>{errors.url}</AlertDescription>
                            </Alert>
                        </div>
                    )}
                    {/* URL Input */}
                    <div className="col-span-12 flex items-center gap-4">
                        <Label htmlFor="url" className="whitespace-nowrap w-32 text-sm font-medium">
                            Enter the URL:
                        </Label>
                        <Input
                            type="url"
                            id="url"
                            name="url"
                            value={formData.url || ''}
                            onChange={(e) => handleInputChange('url', e.target.value)}
                            placeholder="https://example.com"
                            className="flex-1"
                            aria-invalid={!!errors.url}
                        />
                    </div>

                    {/* Alias Error */}
                    {errors.alias && (
                        <div className="col-span-12">
                            <Alert variant="destructive">
                                <AlertDescription>{errors.alias}</AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {/* Alias Input */}
                    <div className="col-span-6 flex items-center gap-4 w-full">
                        <Label htmlFor="alias" className="whitespace-nowrap w-32 text-sm font-medium">
                            Alias (optional):
                        </Label>
                        <Input
                            type="text"
                            id="alias"
                            name="alias"
                            value={formData.alias || ''}
                            onChange={(e) => handleInputChange('alias', e.target.value)}
                            placeholder="my-custom-alias"
                            className="flex-1"
                            aria-invalid={!!errors.alias}
                        />
                    </div>

                    {/* Checkbox */}
                    <div className="col-span-2 flex items-center justify-center gap-2">
                        <Label htmlFor="show-expiration" className="text-sm">
                            expires?
                        </Label>
                        <Checkbox
                            id="show-expiration"
                            checked={showExpiration}
                            onCheckedChange={handleExpirationToggle}
                        />
                    </div>

                    {/* Submit Button - spans both rows when expiration is shown */}
                    <div className={`col-span-4 ${showExpiration ? 'row-span-2' : ''}`}>
                        <Button
                            type="submit"
                            disabled={hasErrors || isSubmitting}
                            className="w-full h-full"
                        >
                            {isSubmitting ? 'Shortening...' : 'Shorten URL'}
                        </Button>
                    </div>

                    {/* Expiration Error */}
                    {showExpiration && errors.expires_at && (
                        <div className="col-span-12">
                            <Alert variant="destructive">
                                <AlertDescription>{errors.expires_at}</AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {/* Expiration Input - only shown when checkbox is checked */}
                    {showExpiration && (
                        <div className="col-span-8 flex items-center gap-4">
                            <Label htmlFor="expires_at" className="whitespace-nowrap w-32 text-sm font-medium">
                                Expiration:
                            </Label>
                            <Input
                                type="datetime-local"
                                id="expires_at"
                                name="expires_at"
                                value={formData.expires_at || ''}
                                onChange={(e) => handleInputChange('expires_at', e.target.value)}
                                className="flex-1"
                                aria-invalid={!!errors.expires_at}
                            />
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
