import { Suspense, lazy } from "react";
import { Navigate } from "react-router-dom";

const Loading = <div>Loading....</div>;
const ProductsList = lazy(() => import("../pages/selling/ListPage"));
const ProductsAdd = lazy(() => import("../pages/selling/AddPage"));
const ProductRead = lazy(() => import("../pages/selling/ReadPage"));
const ProductModify = lazy(() => import("../pages/selling/ModifyPage"));
const sellingRouter = () => {
  return [
    {
      // products/list
      path: "list",
      element: (
        <Suspense fallback={Loading}>
          <ProductsList />
        </Suspense>
      ),
    },

    {
      path: "",
      element: <Navigate replace to="/selling/list" />,
    },
    {
      path: "add",
      element: (
        <Suspense fallback={Loading}>
          <ProductsAdd />
        </Suspense>
      ),
    },
    {
      path: "read/:pno",
      element: (
        <Suspense fallback={Loading}>
          <ProductRead />
        </Suspense>
      ),
    },
    {
      path: "modify/:pno",
      element: (
        <Suspense fallback={Loading}>
          <ProductModify />
        </Suspense>
      ),
    },
  ];
};

export default sellingRouter;
