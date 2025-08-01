import { Suspense, lazy } from "react";
import { Navigate } from "react-router-dom";

const Loading = <div>Loading....</div>;
const List = lazy(() => import("../pages/search/ListPage"));
// const Read = lazy(() => import("../pages/selling/ReadPage"));

const searchRouter = () => {
  return [
    {
      path: "list",
      element: (
        <Suspense fallback={Loading}>
          <List />
        </Suspense>
      ),
    },
    {
      path: "",
      element: <Navigate replace to="/search/list" />,
    },
    // {
    //   path: "read",
    //   element: (
    //     <Suspense fallback={Loading}>
    //       <Read />
    //     </Suspense>
    //   ),
    // },
  ];
};

export default searchRouter;
