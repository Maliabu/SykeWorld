/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client"

import React, { JSX } from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { checkEmail , sendHtmlEmail } from "@/server/fetch.actions"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { z } from "zod"
import { redirect } from "next/navigation"
import { ArrowBigLeft, CheckCircle, Eye, EyeOff, LockKeyholeOpenIcon, Mail, Moon, PhoneCall, Sun, XCircle} from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import Image from "next/image"
import Logo from '@/public/images/logo.png'
import { loginSchema, resetPasswordSchema } from "@/lib/validations/auth"
import { dbInsertToken, login } from "@/lib/actions/auth"



export default function StepWise() {
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false);
    const { setTheme } = useTheme() 
    const [showPassword, setShowPassword] = useState(false);
    const [buttonText, setButtonText] = useState("Request Password Link");
    const [loginText, setLoginText] = useState("Sign in");
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [resetSuccess, setReset] = useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword(prev => !prev);
    };

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
          defaultValues: {
            email: "",
            password: "",
        },
      })

      const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
        resolver: zodResolver(resetPasswordSchema),
          defaultValues: {
            email: "",
        },
      })
      async function emailCheck() {
        const email = resetForm.getValues("email");
        const check = await checkEmail(email);

        if (!check.exists) {
            resetForm.setError("root", {
            message: "Account does not exist",
            });

            setTimeout(() => {
            resetForm.clearErrors();
            }, 5000);

            return "";
        }

        return check.email;
        }

      async function loginEmailCheck(){
        const email = form.getValues("email")
        const check = await checkEmail(email)
        if(check.exists == false){
            form.setError("root", {
                "message": "Account doesnot exist"
            })
            setTimeout(() => {
                form.clearErrors()
                }, 5000)
            return check.userId
        } else {
            return check.userId
        }
    }
       
      async function onSubmit(values: z.infer<typeof loginSchema>) {
  setLoginText("Processing...");
  setLoginSuccess(false);

  try {
    const result = await login(values);

    if (result?.error) {
      form.setError("root", {
        message: result.error,
      });

      setLoginText("Sign in");

      setTimeout(() => {
        form.clearErrors();
      }, 5000);

      return;
    }

    // Check for success
    if (!result?.success) {
      form.setError("root", {
        message: result?.error || "Login failed. Please try again.",
      });
      setLoginText("Sign in");
      return;
    }

    // SUCCESS
    setLoginSuccess(true);
    setLoginText("Success");

    // Redirect after showing success - cookies are set by server action
    setTimeout(() => {
      // Force full page navigation to ensure cookies are available
      window.location.href = "/admin/dashboard/home";
    }, 1000);

  } catch (err: any) {
    console.error("Login error:", err);

    form.setError("root", {
      message: err?.message || "Something went wrong. Please try again.",
    });

    setLoginText("Sign in");
  }
}

    async function onSubmit1(values: z.infer<typeof resetPasswordSchema>) {
        setButtonText("processing");

        const result = await fetch("/api/send-reset-email", {
            method: "POST",
            body: JSON.stringify({ email: values.email }),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());

        if (result.success) {
            setButtonText("Email Successful");
            setReset(true);
        } else {
            setButtonText("Email Failed");
            resetForm.setError("root", { message: result.error });
            setTimeout(() => resetForm.clearErrors(), 5000);
        }
        }



    const _next = () => {
      let currStep = currentStep
      currStep = currentStep + 1 
      setCurrentStep(currStep)
    }
    const _prev = () => {
        let currStep = currentStep
        currStep = currentStep - 1
        setCurrentStep(currStep)
    }
    function nextButton() {
        const currStep = currentStep;
        if (currStep == 1) {
            return ( 
                <div className="font-bold flex items-center text-gray-900 dark:text-white"
                onClick = { _next } >
                Forgot Password? <LockKeyholeOpenIcon size={15}/>
                </div>        
            )
        }
        else {
            return ( 
                <div className="font-bold flex items-center text-gray-900 dark:text-white"
                onClick = { _prev } >
                <ArrowBigLeft/> Back to Login 
                </div>        
            )
        }
    }
    return (
        <div className="min-h-screen relative overflow-hidden">
          {/* Background gradients matching dashboard */}
          <div className="fixed inset-0 -z-10">
            {/* Base gradient layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-orange-50/8 to-gray-50 dark:from-black dark:via-gray-950 dark:to-black transition-all duration-1000" />
            
            <div className="dark:hidden absolute inset-0">
              {/* Subtle gray and orange blur orbs */}
              <div className="absolute top-0 left-0 w-96 h-96 bg-gray-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
              <div className="absolute top-1/4 right-0 w-96 h-96 bg-orange-200/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
              <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gray-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
              <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-orange-200/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s', animationDelay: '1s' }} />
              <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-gray-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '11s', animationDelay: '3s' }} />
              
              {/* Additional subtle gray gradient layers with minimal orange */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200/10 via-orange-50/3 to-gray-200/10" />
              <div className="absolute inset-0 bg-gradient-to-tr from-gray-100/8 via-orange-50/2 to-gray-100/8" />
            </div>
            
            {/* Dark mode blur orbs */}
            <div className="hidden dark:block absolute inset-0">
              <div className="absolute top-0 left-0 w-96 h-96 bg-black/50 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
              <div className="absolute top-1/4 right-0 w-96 h-96 bg-gray-950/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
              <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-black/45 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
              <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gray-950/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s', animationDelay: '1s' }} />
              <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-black/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '11s', animationDelay: '3s' }} />
              
              {/* Additional darker shades of black gradient layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-gray-950/20 to-black/60" />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-gray-950/15 to-black/50" />
            </div>
          </div>
          
          {/* Content */}
          <div className="relative z-0 sm:p-16 p-2 flex flex-col items-center min-h-screen">
            <div className="p-4 sm:rounded-l-3xl sr:rounded-t-2xl flex flex-col justify-center items-center text-muted sm:columns-1"> 
               <Image src={Logo} width={150} height={150} alt="logo"/>                  
            </div>
            <div className="sm:p-8 p-4 sm:px-20 sm:pb-16">
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="bg-transparent shadow-none border-0">
                  <Button variant="outline">
                    <Sun className="h-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-50" />
                    <Moon className=" h-[1.2rem] rotate-90 scale-50 transition-all dark:rotate-0 dark:scale-100" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Step1 
                currentStep={currentStep}
                button={nextButton()}
                form={form}
                onSubmit={onSubmit}
                togglePasswordVisibility={togglePasswordVisibility}
                showPassword={showPassword}
                loginText={loginText}
                loginSuccess={loginSuccess}
              />
              <Step2
                currentStep={currentStep}
                onSubmit={onSubmit1}
                prev={nextButton()}
                form={resetForm}
                buttonText={buttonText}
                resetSuccess={resetSuccess}
              />
            </div>
            <div className="text-xs p-4 text-gray-600 dark:text-gray-400">This portal is a copyright of SykeWorld Hotel. Only authorised personnel can have access to it.</div>
          </div>
        </div>
    )
}

function Step1(props:
    {
        currentStep: number,loginText: string,loginSuccess: boolean, form: any, onSubmit: (values: z.infer<typeof loginSchema>) => Promise<void>,button:JSX.Element | null, togglePasswordVisibility: () => void, showPassword: boolean}) {
    if (props.currentStep !== 1) {
        return null
    }
    return (
        <div className=" p-6 w-[350px] bg-background dark:bg-gray-900/80 backdrop-blur-md rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="text-3xl tracking-tight font-bold sm:mb-8 grid justify-center items-center text-gray-900 dark:text-white">Sign in</div>
            <Form {...props.form}>
            <form onSubmit={props.form.handleSubmit(props.onSubmit)}>
            <div className="grid w-full items-center">
                <div>
                    <div className="">
                    <FormField
                        control={props.form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="Email" {...field} className="shadow-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"/>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                </div>
                <div className="mt-2">
                    <div className="">
                    <FormField
                        control={props.form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">Password</FormLabel>
                            <div className="flex items-center">
                                <FormControl>
                                <Input
                                    type={props.showPassword ? "text" : "password"}
                                    {...field}
                                    placeholder="Password"
                                    className="shadow-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
                                />
                                </FormControl>
                                <button
                                type="button"
                                onClick={props.togglePasswordVisibility}
                                className="ml-2 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                {props.showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                            </div>
                            {/* <FormControl>
                            <div className="flex justify-between cursor-pointer">
                            <Input type={props.showPassword ? 'text' : 'password'} id="password" placeholder="Password" {...field} className="dark:border dark:border-muted-foreground shadow-none"/>
                            <p className="text-sm border ml-1 rounded-md p-2" id="see" onClick={() => props.togglePasswordVisibility()}>{props.showPassword ? <Eye size={16}/> : <EyeOff size={16}/>}</p>
                            </div>                            
                            </FormControl> */}
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                </div>
                <Button className=" text-white w-full mt-4" id="submit" type="submit">{props.loginText}</Button>
                </div>
            <div className="text-xs grid justify-center cursor-pointer text-orange-600 dark:text-orange-500 py-4">{props.button}</div>
            {props.form.formState.errors.root && (
                <div className="rounded text-sm font-bold bg-red-400/10 flex justify-center gap-4 text-red-600 p-2"><XCircle/> {props.form.formState.errors.root.message}</div>
            )}
            {props.loginSuccess && (
            <div className="rounded text-sm font-bold bg-green-400/10 flex justify-center gap-4 text-green-600 p-2">
                <CheckCircle className="animate-pulse"/> Signing you in...
            </div>
            )}

            </form>
            </Form>
        </div>
    );
}

function Step2(props:{
    currentStep: number, form: any,resetSuccess: boolean, buttonText: string, onSubmit: (values: z.infer<typeof loginSchema>) => Promise<void>,
    prev: JSX.Element,
    }) {
    if (props.currentStep !== 2) {
        return null
    }
    return (<div className="p-8 w-[350px] bg-background dark:bg-gray-900/80 backdrop-blur-md rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="text-3xl tracking-tight font-bold grid justify-center items-center text-gray-900 dark:text-white">Reset Password</div>
              <div className="text-xs grid justify-center items-center my-4 text-gray-600 dark:text-gray-400">Enter your email to receive a password reset link so you can change your password.</div>
              <Form {...props.form}>
                <form onSubmit={props.form.handleSubmit(props.onSubmit)}>
                <div className="grid items-center">
                    <div>
                        <div className="">
                        <FormField
                            control={props.form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-gray-900 dark:text-white">Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="Email" {...field}  className="shadow-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"/>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                    </div>
                </div>
                <Button className="my-4 text-sm text-white w-full" id="submit1" type="submit">{props.buttonText}</Button>
                {props.form.formState.errors.root && (
                    <div className="rounded text-sm font-bold bg-red-400/10 flex justify-center gap-4 text-red-600 p-2"><XCircle/> {props.form.formState.errors.root.message}</div>
                )}
                {props.resetSuccess && (
            <div className="rounded text-sm font-bold bg-green-400/10 flex justify-center gap-4 text-green-600 p-2">
                <CheckCircle className="animate-pulse"/> Reset successful
            </div>
            )}
                <div className="text-orange-600 dark:text-orange-500 text-xs cursor-pointer flex justify-center mt-2">{props.prev}</div>
                </form>
                </Form>
    </div>);
    }