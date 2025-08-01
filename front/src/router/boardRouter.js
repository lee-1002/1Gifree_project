// src/routes/boardRouter.js
import { Suspense, lazy } from "react";
import { Navigate } from "react-router-dom";

const Loading = <div>Loading...</div>;
const List = lazy(() => import("../pages/board/ListPage"));
const Read = lazy(() => import("../pages/board/ReadPage"));

const boardRouter = () => [
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
    element: <Navigate replace to="/board/list" />,
  },
  {
    path: "read/:bno",
    element: (
      <Suspense fallback={Loading}>
        <Read />
      </Suspense>
    ),
  },
];

export default boardRouter;
