"use client";

import { useZeroAuth } from "@frontend/zero";
import { useQuery } from "@rocicorp/zero/react";
import { useEffect, useReducer } from "react";
import { useLocation } from "wouter";
import { queries } from "@/queries";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/frontend/app/ui/button";
import { Label } from "@/frontend/app/ui/label";
import {
  Page,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/frontend/app/ui/page";
import { PinKeypad } from "./pin-keypad";

// --- Types ---

interface StaffInfo {
  principalId: string;
  staffCode: string;
  displayName: string;
}

type Step = { kind: "code" } | { kind: "pin"; staff: StaffInfo };

type Pending = "none" | "lookup" | "login";

interface State {
  step: Step;
  code: string;
  pin: string;
  lookupCode: string | null;
  pending: Pending;
  error: string | null;
}

type Action =
  | { type: "CODE_CHANGE"; value: string }
  | { type: "CODE_SUBMIT"; code: string }
  | { type: "PIN_CHANGE"; value: string }
  | { type: "PIN_SUBMIT" }
  | { type: "LOOKUP_SUCCESS"; staff: StaffInfo }
  | { type: "LOOKUP_NOT_FOUND" }
  | { type: "LOGIN_SUCCESS" }
  | { type: "LOGIN_ERROR"; error: string }
  | { type: "BACK" };

// --- Reducer ---

const initialState: State = {
  step: { kind: "code" },
  code: "",
  pin: "",
  lookupCode: null,
  pending: "none",
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "CODE_CHANGE":
      return { ...state, code: action.value, error: null };

    case "CODE_SUBMIT":
      return {
        ...state,
        lookupCode: action.code,
        pending: "lookup",
        error: null,
      };

    case "PIN_CHANGE":
      return { ...state, pin: action.value, error: null };

    case "PIN_SUBMIT":
      return { ...state, pending: "login", error: null };

    case "LOOKUP_SUCCESS":
      return {
        ...state,
        step: { kind: "pin", staff: action.staff },
        code: action.staff.staffCode,
        lookupCode: null,
        pending: "none",
        error: null,
      };

    case "LOOKUP_NOT_FOUND":
      return {
        ...state,
        code: "",
        lookupCode: null,
        pending: "none",
        error: "Staff not found",
      };

    case "LOGIN_SUCCESS":
      return { ...state, pending: "none" };

    case "LOGIN_ERROR":
      return {
        ...state,
        pin: "",
        pending: "none",
        error: action.error,
      };

    case "BACK":
      return initialState;

    default:
      return state;
  }
}

// --- Component ---

export function TenantStaffLogin() {
  const { loginWithPin } = useZeroAuth();
  const [, setLocation] = useLocation();
  const [state, dispatch] = useReducer(reducer, initialState);

  const { step, code, pin, lookupCode, pending, error } = state;
  const inPinStep = step.kind === "pin";
  const staff = inPinStep ? step.staff : null;

  // Query staff by code when lookupCode is set
  const [staffResult, staffQueryStatus] = useQuery(
    lookupCode ? queries.login.staffByCode({ staffCode: lookupCode }) : null,
  );

  // React to query completion
  useEffect(() => {
    if (!lookupCode || pending !== "lookup") return;
    if (staffQueryStatus.type !== "complete") return;

    if (staffResult?.principal) {
      dispatch({
        type: "LOOKUP_SUCCESS",
        staff: {
          principalId: staffResult.principalId,
          staffCode: staffResult.staffCode,
          displayName: staffResult.principal.displayName,
        },
      });
    } else {
      dispatch({ type: "LOOKUP_NOT_FOUND" });
    }
  }, [lookupCode, pending, staffResult, staffQueryStatus.type]);

  // Handlers
  const handleCodeChange = (value: string) => {
    dispatch({ type: "CODE_CHANGE", value });
  };

  const handleCodeComplete = (value: string) => {
    dispatch({ type: "CODE_SUBMIT", code: value });
  };

  const handlePinChange = (value: string) => {
    dispatch({ type: "PIN_CHANGE", value });
  };

  const handlePinComplete = async (value: string) => {
    if (!staff) return;
    dispatch({ type: "PIN_SUBMIT" });

    const result = await loginWithPin(staff.staffCode, value);

    if (result.success) {
      dispatch({ type: "LOGIN_SUCCESS" });
      setLocation("/");
    } else {
      dispatch({ type: "LOGIN_ERROR", error: result.error });
    }
  };

  const handleBack = () => {
    dispatch({ type: "BACK" });
  };

  const disabled = pending !== "none";

  return (
    <Page className="w-full lg:max-w-lg lg:shadow-lg">
      <PageHeader className="bg-gray-100 border-b">
        <div className="flex items-center">
          <div className="w-9 h-9 flex items-center justify-center">
            {inPinStep && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                disabled={disabled}
                aria-label="Back to code entry"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
          <PageTitle className="text-2xl flex-1 text-center">
            {inPinStep ? `Welcome, ${staff?.displayName?.split(" ")[0]}` : "Staff Login"}
          </PageTitle>
          <div className="w-9" />
        </div>
      </PageHeader>
      <PageContent className="p-6">
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-3 bg-gray-200">
              <span className="text-2xl font-semibold">
                {inPinStep
                  ? staff?.displayName
                      ?.split(" ")
                      .map((n) => n[0]?.toUpperCase())
                      .join("") || "?"
                  : "\u00A0"}
              </span>
            </div>
            <p className="text-lg font-medium h-7">
              {inPinStep ? staff?.displayName : "\u00A0"}
            </p>
            <p className="text-sm text-muted-foreground h-5">
              {inPinStep ? `Code: ${staff?.staffCode}` : "\u00A0"}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-center block">
              {inPinStep ? "Enter your PIN" : "Enter your 3-digit staff code"}
            </Label>
            <PinKeypad
              value={inPinStep ? pin : code}
              onChange={inPinStep ? handlePinChange : handleCodeChange}
              onComplete={inPinStep ? handlePinComplete : handleCodeComplete}
              error={error}
              disabled={disabled}
              maxLength={inPinStep ? 4 : 3}
            />
          </div>
        </div>
      </PageContent>
    </Page>
  );
}
