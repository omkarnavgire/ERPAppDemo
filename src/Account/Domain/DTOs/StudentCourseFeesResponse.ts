
export interface StudentCourseFeesResponse {
    statusCode: number;
    message: string;
    data: {
        courseId: number;
        courseName: string;
        actualFees: number;
        discount: number;
        finalFees: number;
    };
}
