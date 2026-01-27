/// <reference types="jest" />
declare const mockAxiosInstance: {
    get: jest.Mock<any, any, any>;
    post: jest.Mock<any, any, any>;
    put: jest.Mock<any, any, any>;
    patch: jest.Mock<any, any, any>;
    delete: jest.Mock<any, any, any>;
    request: jest.Mock<any, any, any>;
    interceptors: {
        request: {
            use: jest.Mock<any, any, any>;
        };
        response: {
            use: jest.Mock<any, any, any>;
        };
    };
};
declare const axios: {
    create: jest.Mock<{
        get: jest.Mock<any, any, any>;
        post: jest.Mock<any, any, any>;
        put: jest.Mock<any, any, any>;
        patch: jest.Mock<any, any, any>;
        delete: jest.Mock<any, any, any>;
        request: jest.Mock<any, any, any>;
        interceptors: {
            request: {
                use: jest.Mock<any, any, any>;
            };
            response: {
                use: jest.Mock<any, any, any>;
            };
        };
    }, [], any>;
    isAxiosError: jest.Mock<any, any, any>;
};
export default axios;
export { mockAxiosInstance };
//# sourceMappingURL=axios.d.ts.map