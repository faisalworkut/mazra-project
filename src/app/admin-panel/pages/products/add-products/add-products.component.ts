import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../../../pages/products/service/product.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { serviceCategoryMap } from '../../../../core/constant/categories';
import { ProductCategoryService } from '../../service-category/product-category/service/product-category.service';
import { ProductServicesService } from '../../service-category/product-services/service/product-services.service';

@Component({
  selector: 'app-add-products',
  standalone: true,
  imports: [NgIf,NgFor, ReactiveFormsModule],
  templateUrl: './add-products.component.html',
  styleUrl: './add-products.component.scss'
})
export class AddProductsComponent implements OnInit {
productForm: FormGroup;
  images: File[] = [];
  previewImages: string[] = [];
  imageLimitExceeded = false;
  services: any [] = [];
  categorys:any [] = []; 
  constructor(private fb: FormBuilder,
    private _productService: ProductService,
    private _router: Router,
    private categoryService: ProductCategoryService , 
    private productService: ProductServicesService
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]],
      stock: [null, [Validators.required, Validators.min(0)]],
      discountPercent: [null],
      category: ['', Validators.required],
      service: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.getserviceList();
  }


  getserviceList() {
    this.productService.getServiceList().subscribe({
      next: (response:any) => {
        console.log('Service list fetched successfully', response);
        this.services = response?.data;
        // Handle the response as needed
      },
      error: (error) => {
        console.error('Error fetching service list', error);
        Swal.fire({
          title: 'Error',
          text: error?.message,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  onServiceChange(event: Event) {
  const selectedServiceId = (event.target as HTMLSelectElement).value;

  console.log('Selected Service ID:', event);

  if (selectedServiceId) {
    this.categoryService.getCategoryById(selectedServiceId).subscribe({
      next: (res: any) => {
        this.categorys = res?.data || [];
        this.productForm.get('category')?.enable();
      },
      error:( err:any)=> {
        console.error('Category fetch error', err);
        this.categorys = [];
        this.productForm.get('category')?.disable();
      }
    });
  } else {
    this.categorys = [];
    this.productForm.get('category')?.setValue('');
    this.productForm.get('category')?.disable();
  }
}


  get f() {
    return this.productForm.controls;
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];

    if (files.length > 5) {
      this.imageLimitExceeded = true;
      return;
    }

    this.imageLimitExceeded = false;
    this.images = files;
    this.previewImages = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          this.previewImages.push(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  onSubmit() {
    if (this.productForm.invalid || this.imageLimitExceeded) return;

    console.log('Form Data:', this.productForm.value);
    

    const formData = new FormData();
    formData.append('name', this.productForm.value.name);
    formData.append('description', this.productForm.value.description);
    formData.append('price', this.productForm.value.price);
    formData.append('discountPercent', this.productForm.value.discountPercent || '');
    formData.append('category', this.productForm.value.category);
    formData.append('stock', this.productForm.value.stock);
    formData.append('service', this.productForm.value.service);

    this.images.forEach((file, index) => {
      formData.append(`images`, file);
    });

    this._productService.addProducts(formData).subscribe(
      response => {
        if(response && response.success) {
          Swal.fire({
          position: "top-end",
          icon: "success",
          title: response.message || 'Product added successfully',
          showConfirmButton: false,
          timer: 1500
        });
        this._router.navigate(['/admin-panel/products']);
        }
        // Reset form and images after successful submission
        this.productForm.reset();
        this.images = [];
        this.previewImages = [];
      },
      error => {
        console.error('Error adding product', error);
        // Handle error appropriately
      }
    );
    // Replace this with your API call
  }
}
