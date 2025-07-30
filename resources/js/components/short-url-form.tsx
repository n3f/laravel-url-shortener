import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ShortUrlFormProps {
    className?: string;
}

export function ShortUrlForm({ className }: ShortUrlFormProps) {
    const [formData, setFormData] = useState({
        url: '',
        alias: ''
    });
    const [errors, setErrors] = useState<{ url?: string; alias?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateUrl = (url: string): string | undefined => {
        if (!url.trim()) {
            return 'URL is required';
        }

        const trimmedUrl = url.trim();

        try {
            // If no protocol, prepend http:// for validation
            const urlToValidate = trimmedUrl.includes('://') ? trimmedUrl : `http://${trimmedUrl}`;
            new URL(urlToValidate);
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

    const debouncedValidation = (field: 'url' | 'alias', value: string) => {
        const timeoutId = setTimeout(() => {
            let error: string | undefined;

            if (field === 'url') {
                error = validateUrl(value);
            } else if (field === 'alias') {
                error = validateAlias(value);
            }

            setErrors(prev => ({ ...prev, [field]: error }));
        }, 300);

        return timeoutId;
    };

    const handleInputChange = (field: 'url' | 'alias', value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Debounced validation
        const timeoutId = debouncedValidation(field, value);

        return () => clearTimeout(timeoutId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Final validation before submission
        const urlError = validateUrl(formData.url);
        const aliasError = validateAlias(formData.alias);

        if (urlError || aliasError) {
            setErrors({ url: urlError, alias: aliasError });
            return;
        }

        setIsSubmitting(true);

        try {
            // TODO: Submit to backend
            console.log('Submitting:', formData);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Reset form on success
            setFormData({ url: '', alias: '' });
            setErrors({});
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
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                            <Label htmlFor="url" className="whitespace-nowrap w-32 text-sm font-medium">
                                Enter the URL:
                            </Label>
                            <Input
                                type="url"
                                id="url"
                                name="url"
                                value={formData.url}
                                onChange={(e) => handleInputChange('url', e.target.value)}
                                placeholder="https://example.com"
                                className="flex-1"
                                aria-invalid={!!errors.url}
                            />
                        </div>
                        {errors.url && (
                            <Alert variant="destructive" className="mt-2">
                                <AlertDescription>{errors.url}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <Label htmlFor="alias" className="whitespace-nowrap w-32 text-sm font-medium">
                                    Alias (optional):
                                </Label>
                                <Input
                                    type="text"
                                    id="alias"
                                    name="alias"
                                    value={formData.alias}
                                    onChange={(e) => handleInputChange('alias', e.target.value)}
                                    placeholder="my-custom-alias"
                                    className="flex-1"
                                    aria-invalid={!!errors.alias}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={hasErrors || isSubmitting}
                                className="w-full lg:w-auto"
                            >
                                {isSubmitting ? 'Shortening...' : 'Shorten URL'}
                            </Button>
                        </div>
                        {errors.alias && (
                            <Alert variant="destructive" className="mt-2">
                                <AlertDescription>{errors.alias}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
