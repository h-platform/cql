import axios from 'axios';
import { CommandResponse } from './CommandResponse';
import { handleAxiosError } from './handle-axios-error';

export interface HModuleConfigs {
    moduleName: string;
    commands: Record<string, any>;
    queries: Record<string, any>;
}

export type CQClientOptions = {
    token: string | null;
    useLocalStorage: boolean;
    localStoragePath: string;
}

const defaultCQClientOptions: CQClientOptions = {
    token: null,
    useLocalStorage: true,
    localStoragePath: 'token',
}

export class CQClient {
    options: CQClientOptions = { ...defaultCQClientOptions };

    constructor(
        private readonly baseUrl: string,
        providedOptions: CQClientOptions = defaultCQClientOptions,
    ) {
        this.options = {
            ...defaultCQClientOptions,
            ...providedOptions
        }
    }

    getToken() {
        if (this.options.token) {
            return this.options.token
        } else if (this.options.useLocalStorage) {
            if (typeof window !== 'undefined' && window.localStorage) {
                return window?.localStorage?.getItem(this.options.localStoragePath || 'token')
            } else {
                return null;
            }
        } else return null;
    }

    async command<T>(module: string, command: string, payload: any): Promise<CommandResponse<any>> {
        try {
            const { data } = await axios.post<CommandResponse<any>>(`${this.baseUrl}/${module}/commands/${command}`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`,
                }
            })
            return data as CommandResponse<T>;
        } catch (err) {
            throw this.handleError(err);
        }
    }

    async query(module: string, query: string, payload: any) {
        try {
            const { data } = await axios.post(`${this.baseUrl}/${module}/queries/${query}`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`,
                }
            })
            return data;
        } catch (err) {
            throw this.handleError(err);
        }
    }

    async post<T>(url: string, payload: any) {
        try {
            const response = await axios.post<T>(`${this.baseUrl}/${url}`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`,
                }
            })
            return response.data as T
        } catch (err) {
            throw this.handleError(err);
        }
    }

    handleError(err: any) {
        return CommandResponse.error('CQClient Request Failed', 'CQClientError', handleAxiosError(err));
    }
}

