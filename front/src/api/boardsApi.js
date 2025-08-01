// src/api/boardsApi.js
import axios from "axios";
import { API_SERVER_HOST } from "./backendApi";

const BASE_URL = `${API_SERVER_HOST}/api/boards`;

export const fetchBoards = () => axios.get(BASE_URL).then((res) => res.data);

export const fetchBoardsWithMembers = () =>
  axios.get(`${BASE_URL}/with-members`).then((res) => res.data);

export const fetchBoard = (bno) =>
  axios.get(`${BASE_URL}/${bno}`).then((res) => res.data);

export const postAddBoard = (formData) =>
  axios
    .post(BASE_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);

export const postModifyBoard = (bno, formData) =>
  axios
    .put(`${BASE_URL}/${bno}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);

export const incrementViews = (bno) =>
  axios.put(`${BASE_URL}/${bno}/views`).then((res) => res.data);

export const deleteBoard = (bno) =>
  axios.delete(`${BASE_URL}/${bno}`).then((res) => res.data);
