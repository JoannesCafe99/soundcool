import { BASE_URL } from '../constants';
import { postRequest, patchRequest } from '../api';
export const projectUrl = () => `${BASE_URL}/projects/update`;
export const projectCreateUrl = () => `${BASE_URL}/projects/new`;

export const updateProject = payload => {
    const url = projectUrl();
    return patchRequest(url, payload);
  };
  export const createProject = payload => {
    const url = projectCreateUrl();
    return postRequest(url, payload);
  };
