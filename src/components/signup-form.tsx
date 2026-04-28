"use client"
import { useActionState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signUp, type AuthState } from "@/server/users"

const initialState: AuthState = {}
export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction, pending] = useActionState(signUp, initialState)

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form action={formAction} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Enter your details below to get started
                </p>
              </div>
              {state.error && (
                <FieldError>{state.error}</FieldError>
              )}
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                />
                <FieldError errors={state.fieldErrors?.name?.map((m) => ({ message: m }))} />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
                <FieldError errors={state.fieldErrors?.email?.map((m) => ({ message: m }))} />
                <FieldDescription>
                  We&apos;ll use this to contact you. We will not share your
                  email with anyone else.
                </FieldDescription>
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input id="password" name="password" type="password" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirmPassword">
                      Confirm Password
                    </FieldLabel>
                    <Input id="confirmPassword" name="confirmPassword" type="password" required />
                  </Field>
                </Field>
                <FieldError errors={state.fieldErrors?.password?.map((m) => ({ message: m }))} />
                <FieldError errors={state.fieldErrors?.confirmPassword?.map((m) => ({ message: m }))} />
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <Button type="submit" disabled={pending}>
                  {pending ? "Creating account…" : "Create Account"}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Already have an account?{" "}
                <a href="/login">Sign in</a>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/nback.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
