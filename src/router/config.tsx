
import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const Home = lazy(() => import('../pages/home/page'));
const Search = lazy(() => import('../pages/search/page'));
const SupplierDetail = lazy(() => import('../pages/supplier/page'));
const Categories = lazy(() => import('../pages/categories/page'));
const About = lazy(() => import('../pages/about/page'));
const Contact = lazy(() => import('../pages/contact/page'));
const FAQ = lazy(() => import('../pages/faq/page'));
const Help = lazy(() => import('../pages/help/page'));
const Privacy = lazy(() => import('../pages/privacy/page'));
const Login = lazy(() => import('../pages/auth/login'));
const Register = lazy(() => import('../pages/auth/register'));
const Dashboard = lazy(() => import('../pages/dashboard/page'));
const NotFound = lazy(() => import('../pages/NotFound'));
const Admin = lazy(() => import('../pages/admin/page'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/search',
    element: <Search />,
  },
  {
    path: '/supplier/:id',
    element: <SupplierDetail />,
  },
  {
    path: '/categories',
    element: <Categories />,
  },
  {
    path: '/about',
    element: <About />,
  },
  {
    path: '/contact',
    element: <Contact />,
  },
  {
    path: '/faq',
    element: <FAQ />,
  },
  {
    path: '/help',
    element: <Help />,
  },
  {
    path: '/privacy',
    element: <Privacy />,
  },
  {
    path: '/auth/login',
    element: <Login />,
  },
  {
    path: '/auth/register',
    element: <Register />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/admin',
    element: <Admin />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
