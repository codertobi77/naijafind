
import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SignUp, useAuth, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function Register() {
	const [searchParams] = useSearchParams();
	const { isSignedIn, isLoaded } = useAuth();
	const meData = useQuery(api.users.me, {});
	const navigate = useNavigate();

	useEffect(() => {
		if (isLoaded && isSignedIn && meData !== undefined) {
			// Si l'utilisateur n'a pas encore choisi de rôle, rediriger vers la sélection
			if (!meData?.user?.user_type) {
				navigate('/auth/choose-role', { replace: true });
			} else if (meData.user.user_type === 'supplier') {
				// Si supplier mais pas de profil supplier, rediriger vers le setup
				if (!meData.supplier) {
					navigate('/auth/supplier-setup', { replace: true });
				} else {
					navigate('/dashboard', { replace: true });
				}
			} else if (meData.user.user_type === 'admin') {
				navigate('/admin', { replace: true });
			} else {
				navigate('/', { replace: true });
			}
		}
	}, [isLoaded, isSignedIn, meData, navigate]);

	// Show loading state while checking authentication
	if (!isLoaded) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Chargement...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<Link to="/" className="flex justify-center">
					<span className="text-3xl font-bold text-green-600" style={{ fontFamily: 'Pacifico, serif' }}>
						NaijaFind
					</span>
				</Link>
				<h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Créer votre compte</h2>
				<p className="mt-2 text-center text-sm text-gray-600">
					Ou{' '}
					<Link to="/auth/login" className="font-medium text-green-600 hover:text-green-500">
						connectez-vous à votre compte existant
					</Link>
				</p>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
					<SignedOut>
						<SignUp 
							appearance={{ variables: { colorPrimary: '#16a34a' } }} 
							routing="hash" 
							afterSignUpUrl="/auth/choose-role" 
							signInUrl="/auth/login" 
						/>
					</SignedOut>
					<SignedIn>
						<div className="text-center py-8">
							<p className="text-gray-600 mb-4">Vous êtes déjà connecté.</p>
							<Link to="/" className="text-green-600 hover:text-green-500 font-medium">
								Retour à l'accueil
							</Link>
						</div>
					</SignedIn>
					<div className="mt-6 text-center">
						<Link to="/" className="text-green-600 hover:text-green-500 font-medium">
							<i className="ri-arrow-left-line mr-1"></i>
							Retour à l'accueil
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
