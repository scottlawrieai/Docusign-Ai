import RegisterForm from "@/components/auth/RegisterForm";

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">DocuSign Clone</h1>
          <p className="text-muted-foreground mt-2">Create your account</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;
