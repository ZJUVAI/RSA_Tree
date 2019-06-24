#ifndef FILE_H
#define FILE_H

#include <stdio.h>
#include <assert.h>

#define ASSERT assert  // RTree uses ASSERT( condition )

class RTFileStream {
    FILE* m_file;

   public:
    RTFileStream() { m_file = NULL; }

    ~RTFileStream() { Close(); }

    bool OpenRead(const char* a_fileName) {
        m_file = fopen(a_fileName, "rb");
        if (!m_file) {
            return false;
        }
        return true;
    }

    bool OpenCover(const char* a_fileName) {
        m_file = fopen(a_fileName, "r+");
        if (!m_file) {
            return false;
        }
        return true;
    }

    bool OpenWrite(const char* a_fileName) {
        m_file = fopen(a_fileName, "wb");
        if (!m_file) {
            return false;
        }
        return true;
    }

    void Close() {
        if (m_file) {
            fclose(m_file);
            m_file = NULL;
        }
    }
    
    bool End() {
        return feof(m_file);
    }
    
    template <typename TYPE>
    size_t Write(const TYPE& a_value) {
        ASSERT(m_file);
        return fwrite((void*) &a_value, sizeof(a_value), 1, m_file);
    }

    template <typename TYPE>
    size_t WriteArray(const TYPE* a_array, int a_count) {
        ASSERT(m_file);
        return fwrite((void*) a_array, sizeof(TYPE) * a_count, 1, m_file);
    }
    
    void WriteString(char* x) {
        fprintf(m_file, "%s", x);
    }

    void WriteInt(int x) {
        fprintf(m_file, "%d\n", x);
    }

    void WriteIntArray(int *x, int num) {
        for(int i = 0; i < num; ++i)
            fprintf(m_file, "%d ", x[i]);
        fprintf(m_file, "\n");
    }

    void WriteFloat(float x) {
        fprintf(m_file, "%.9f\n", x);
    }

    void WriteFloatArray(float *x, int num) {
        for(int i = 0; i < num; ++i)
            fprintf(m_file, "%.9f ", x[i]);
        fprintf(m_file, "\n");
    }

    template <typename TYPE>
    size_t Read(TYPE& a_value) {
        ASSERT(m_file);
        return fread((void*) &a_value, sizeof(a_value), 1, m_file);
    }

    template <typename TYPE>
    size_t ReadArray(TYPE* a_array, int a_count) {
        ASSERT(m_file);
        return fread((void*) a_array, sizeof(TYPE) * a_count, 1, m_file);
    }
};

#endif