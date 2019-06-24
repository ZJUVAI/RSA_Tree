#ifndef BASASUYA_LIST_H
#define BASASUYA_LIST_H

#include <cstdio>
#include <iostream>
using namespace std;

class Node {
   public:
    float *data;
    Node *next;
    Node() {}
    Node(float *da = NULL, Node *p = NULL) {
        this->data = da;
        this->next = p;
    }
};

class List {
   private:
    int dim;

   public:
    Node *head, *tail;
    List(int _dim = 2) {
        head = tail = NULL;
        dim = _dim;
    };

    void print();

    void insert(float *da);

    float *getValueAt(int position);
};

float *List::getValueAt(int position) {
    Node *p = head;
    if (p == NULL) {
        cout << "The List is Empty!" << endl;
    } else {
        int posi = 0;
        while (p != NULL && posi != position) {
            posi++;
            p = p->next;
        }
        if (p == NULL) {
            cout << "There is no value of this position in this List!" << endl;
        } else {
            cout << "In this Position,the value is" << p->data << endl;
        }
    }
    return p->data;
}

void List::insert(float *da) {
    if (head == NULL) {
        head = tail = new Node(da);
        head->next = NULL;
        tail->next = NULL;
    } else {
        Node *p = new Node(da);
        tail->next = p;
        tail = p;
        tail->next = NULL;
    }
}

void List::print() {
    Node *p = head;
    while (p != NULL) {
        for (int i = 0; i < dim; ++i) {
            cout << p->data[i] << " ";
        }
        cout << endl;
        p = p->next;
    }
    cout << endl;
}

#endif