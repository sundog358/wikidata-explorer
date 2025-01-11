<<<<<<< HEAD
"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
=======
'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
<<<<<<< HEAD
} from "react-hook-form";

import { cn } from "@/docs/utils";
import { Label } from "@/components/ui/label";
=======
} from 'react-hook-form';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
<<<<<<< HEAD
    throw new Error("useFormField should be used within <FormField>");
=======
    throw new Error('useFormField should be used within <FormField>');
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
<<<<<<< HEAD
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";
=======
      <div ref={ref} className={cn('space-y-2', className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = 'FormItem';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      ref={ref}
<<<<<<< HEAD
      className={cn(error && "text-destructive", className)}
=======
      className={cn(error && 'text-destructive', className)}
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
      htmlFor={formItemId}
      {...props}
    />
  );
});
<<<<<<< HEAD
FormLabel.displayName = "FormLabel";
=======
FormLabel.displayName = 'FormLabel';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
<<<<<<< HEAD
FormControl.displayName = "FormControl";
=======
FormControl.displayName = 'FormControl';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
<<<<<<< HEAD
      className={cn("text-sm text-muted-foreground", className)}
=======
      className={cn('text-sm text-muted-foreground', className)}
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
      {...props}
    />
  );
});
<<<<<<< HEAD
FormDescription.displayName = "FormDescription";
=======
FormDescription.displayName = 'FormDescription';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
<<<<<<< HEAD
      className={cn("text-sm font-medium text-destructive", className)}
=======
      className={cn('text-sm font-medium text-destructive', className)}
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52
      {...props}
    >
      {body}
    </p>
  );
});
<<<<<<< HEAD
FormMessage.displayName = "FormMessage";
=======
FormMessage.displayName = 'FormMessage';
>>>>>>> dfe5b3cb4a621dce88b3e6551caa56ca34160a52

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
