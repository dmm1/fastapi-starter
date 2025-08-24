import * as React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { cn } from '~/lib/utils';

export const Input = React.forwardRef<TextInput, TextInputProps>(
    ({ className, ...props }, ref) => {
        return (
            <TextInput
                ref={ref}
                className={cn(
                    'border border-input rounded-md px-3 py-2 text-base text-foreground bg-background',
                    className
                )}
                placeholderTextColor="#888"
                {...props}
            />
        );
    }
);
Input.displayName = 'Input';
