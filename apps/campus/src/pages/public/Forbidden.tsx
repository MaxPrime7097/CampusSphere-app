import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Forbidden() {
  const navigate = useNavigate();

  return (
     <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <img src="/Illustrations/403 Error Forbidden-amico.svg" 
             alt="403"
             className="w-96 h-96 center" />
        <h1 className="text-2xl font-bold">Accès interdit</h1>
        <p className="mb-4 text-xl text-gray-600">Vous n'avez pas les permissions administrateur requises pour accéder à cette page.</p>
        <Button variant="link" className="px-0 h-auto text-s text-primary" onClick={() => navigate('/')}
            >
              Return to Home
        </Button>
      </div>
    </div>
  );
}
