import SignUpScreen from "@/components/auth/SignUpScreen";

// Student sign-up. Teachers: /sign-up/teacher; parents: /sign-up/parent.
export default function SignUp() {
  return <SignUpScreen accountType="Student" />;
}
