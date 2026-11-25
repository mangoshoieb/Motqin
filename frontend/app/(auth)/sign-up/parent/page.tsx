import SignUpScreen from "@/components/auth/SignUpScreen";

// Parent or supervisor sign-up: the backend calls this account type "Mentor".
export default function ParentSignUp() {
  return <SignUpScreen accountType="Mentor" />;
}
