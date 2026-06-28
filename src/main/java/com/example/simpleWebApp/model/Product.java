package com.example.simpleWebApp.model;

import org.springframework.stereotype.Component;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class Product {
    private int prodId;
    private String prodName;
    private int price;

}
