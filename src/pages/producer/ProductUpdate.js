import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { decodeJwt } from "../../utils/tokenUtils";
import { callProductDetailApi, callUpdateProductApi } from "../../apis/ProductApiCall";


import ProductManageCSS from "./css/ProductManage.module.css";
import ProductRegistCSS from "./css/ProductRegist.module.css";
import UserInfoCSS from "../../components/signup/css/UserInfoForm.module.css";

function ProductUpdate() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const params = useParams();
    const productDetail = useSelector(state => state.productReducer);

    const [productImage, setProductImage] = useState(null);
    const [imageUrl, setImageUrl] = useState();
    const imageInput = useRef();

    const isLogin = window.localStorage.getItem("accessToken");
    const producerUsername = isLogin ? decodeJwt(isLogin).sub : null;

    const [form, setForm] = useState({
        productName: "",
        productPrice: 0,
        productCheck: "",
        productDesc: "",
        smallCategory: {
            smallCategoryId: "",
            smallCategoryName: "",
            mediumCategoryId: "",
        },
        options: [],
    });

    const [option, setOption] = useState({
        optionDesc: "기본 옵션",
        addPrice: 0,
        optionQuantity: 0,
        optionCheck: "Y"
    });

    // const largeCategories = [
    //     { largeCategoryId: "2", largeCategoryName: "식품" },
    //     { largeCategoryId: "3", largeCategoryName: "헬스&뷰티" },
    //     { largeCategoryId: "4", largeCategoryName: "패션" },
    // ];

    const [selectedLargeCategory, setSelectedLargeCategory] = useState("");
    const [selectedMediumCategory, setSelectedMediumCategory] = useState("");
    const [mediumCategories, setMediumCategories] = useState([]);
    const [smallCategories, setSmallCategories] = useState([]);

    useEffect(() => {
        dispatch(callProductDetailApi({
            productId: params.productId
        }));
    }, [params.productId]);

    useEffect(() => {
        if (productDetail) {
            setForm({
                ...form,
                productName: productDetail.productName,
                productPrice: productDetail.productPrice,
                productCheck: productDetail.productCheck,
                productDesc: productDetail.productDesc,
                smallCategory: productDetail.smallCategory,
                options: productDetail.options,
            });

            setImageUrl(productDetail.productImg || productDetail.productThumbnail);

            const mediumCategoryId = productDetail.smallCategory?.mediumCategoryId || "";
            const smallCategoryId = productDetail.smallCategory?.smallCategoryId || "";

            if (mediumCategoryId) {
                fetch(
                    `http://${process.env.REACT_APP_RESTAPI_IP}:8080/api/products/medium-categories?largeCategory=${selectedLargeCategory}`
                )
                    .then((res) => res.json())
                    .then((response) => {
                        if (Array.isArray(response.data)) {
                            setMediumCategories(response.data);
                            setSelectedMediumCategory(mediumCategoryId);

                            const mediumCategory = response.data.find(category => category.mediumCategoryId === mediumCategoryId);
                            if (mediumCategory) {
                                setSelectedLargeCategory(mediumCategory.largeCategoryId);
                            }
                        }
                    })
                    .catch((error) => {
                        console.error("Failed to fetch 소분류 categories:", error);
                    });
            }

            if (smallCategoryId) {
                fetch(
                    `http://${process.env.REACT_APP_RESTAPI_IP}:8080/api/products/small-categories?mediumCategory=${mediumCategoryId}`
                )
                    .then((res) => res.json())
                    .then((response) => {
                        if (Array.isArray(response.data)) {
                            setSmallCategories(response.data);
                        }
                    })
                    .catch((error) => {
                        console.error("Failed to fetch 소분류 categories:", error);
                    });
            }
        }
    }, [productDetail]);

    useEffect(() => {
        if (selectedLargeCategory) {
            fetch(
                `http://${process.env.REACT_APP_RESTAPI_IP}:8080/api/products/medium-categories?largeCategory=${selectedLargeCategory}`
            )
                .then((res) => res.json())
                .then((response) => {
                    if (Array.isArray(response.data)) {
                        setMediumCategories(response.data);
                    } else {
                        setMediumCategories([]);
                    }
                })
                .catch((error) => {
                    console.error("Failed to fetch 소분류 categories:", error);
                    setMediumCategories([]);
                });
        } else {
            setMediumCategories([]);
        }
    }, [selectedLargeCategory]);

    useEffect(() => {
        if (selectedMediumCategory) {
            fetch(
                `http://${process.env.REACT_APP_RESTAPI_IP}:8080/api/products/small-categories?mediumCategory=${selectedMediumCategory}`
            )
                .then((res) => res.json())
                .then((response) => {
                    if (Array.isArray(response.data)) {
                        setSmallCategories(response.data);
                    } else {
                        setSmallCategories([]);
                    }
                })
                .catch((error) => {
                    console.error("Failed to fetch 소분류 categories:", error);
                    setSmallCategories([]);
                });
        } else {
            setSmallCategories([]);
        }
    }, [selectedMediumCategory]);

    useEffect(() => {
        setForm((prevForm) => ({
            ...prevForm,
            smallCategory: {
                ...prevForm.smallCategory,
                mediumCategoryId: selectedMediumCategory,
            },
        }));
    }, [selectedMediumCategory]);

    useEffect(() => {
        if (productImage) {
            const fileReader = new FileReader();
            fileReader.onload = (e) => {
                const { result } = e.target;
                if (result) {
                    setImageUrl(result);
                }
            };
            fileReader.readAsDataURL(productImage);
        }
    }, [productImage]);

    const onChangeImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 10 * 1024 * 1024) {
            alert("파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드할 수 있습니다.");
            return;
        }
        setProductImage(e.target.files[0]);
    };

    const onClickImageUpload = () => {
        imageInput.current.click();
    };

    const onChangeHandler = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const onChangeOptionHandler = (e, index) => {
        const { name, value } = e.target;
        const updatedOptions = [...form.options];
        updatedOptions[index] = {
            ...updatedOptions[index],
            [name]: value,
        };
        setForm({
            ...form,
            options: updatedOptions,
        });
    };

    const onChangeOptionInputHandler = (e) => {
        const { name, value } = e.target;
        setOption((prevOption) => ({
            ...prevOption,
            [name]: value,
        }));
    };

    const onAddOptionHandler = () => {
        setForm((prevForm) => ({
            ...prevForm,
            options: [...prevForm.options, { ...option }],
        }));
        setOption({
            optionDesc: "기본 옵션",
            addPrice: 0,
            optionQuantity: 0,
            optionCheck: "Y"
        });
    };

    const onDeleteOptionHandler = (index) => {
        const updatedOptions = form.options.map((opt, i) => {
            if (i === index) {
                return {
                    ...opt,
                    optionCheck: "N"
                };
            }
            return opt;
        });
        setForm((prevForm) => ({
            ...prevForm,
            options: updatedOptions,
        }));
    };

    const onChangeLargeCategoryHandler = (e) => {
        setSelectedLargeCategory(e.target.value);
    };

    const onChangeMediumCategoryHandler = (e) => {
        setSelectedMediumCategory(e.target.value);
    };

    const onChangeSmallCategoryHandler = (e) => {
        setForm((prevForm) => ({
            ...prevForm,
            smallCategory: {
                ...prevForm.smallCategory,
                smallCategoryId: e.target.value,
            },
        }));
    };

    const onSaveHandler = () => {
        const formData = new FormData();
        
        formData.append('productId', params.productId);
        formData.append('productName', form.productName);
        formData.append('productPrice', form.productPrice);
        formData.append('productCheck', form.productCheck);
        formData.append('productDesc', form.productDesc);

        formData.append('smallCategory.smallCategoryId', form.smallCategory.smallCategoryId);
        formData.append('smallCategory.smallCategoryName', form.smallCategory.smallCategoryName);
        formData.append('smallCategory.mediumCategoryId', form.smallCategory.mediumCategoryId);

        console.log("뭐가 들었나...", form.options);

        form.options.forEach((opt, index) => {
            formData.append(`options[${index}].optionDesc`, opt.optionDesc);
            formData.append(`options[${index}].addPrice`, opt.addPrice);
            formData.append(`options[${index}].optionQuantity`, opt.optionQuantity);
            formData.append(`options[${index}].optionCheck`, opt.optionCheck);
            if (opt.optionId) {
            formData.append(`options[${index}].optionId`, opt.optionId);
            } else {
                formData.append(`options[${index}].optionId`, "");
            }
        });

        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        if (productImage) {
            formData.append('productImage', productImage);
        }

        dispatch(callUpdateProductApi({
            form: formData,
        }));

        alert("상품을 수정했습니다.");
        navigate(`/producer/product-manage`, { replace: true });
    };

    return (
        <div className={ProductManageCSS.manage_box} style={{padding: '114px 0 0 0'}}>
            <div>

                <div className={UserInfoCSS.info}>
                    <p>상품 이름</p>
                    <div className={UserInfoCSS.txt}>
                    <input
                        value={form.productName}
                        name="productName"
                        onChange={onChangeHandler}
                        />
                    </div>
                </div>

            <div style={{display: 'flex', flexFlow: 'row'}}>
                <div style={{margin: '0 15px 0 0'}} className={UserInfoCSS.info}>
                    <p>상품 가격</p>
                    <div className={UserInfoCSS.txt}>
                        <input
                            name="productPrice"
                            type="number"
                            value={form.productPrice}
                            onChange={onChangeHandler}
                        />
                    </div>
                </div>
            </div>


                <div className={UserInfoCSS.info} >
                        <p>판매 여부</p>
                    <div style={{display: 'flex', flexFlow: 'row'}}>
                        {/* <label className={UserInfoCSS.txt} style={{width: '100px', padding: '5px, 10px', margin: '0 15px'}}> */}
                        <div>
                            <label style={{display: 'flex', flexFlow: 'row'}}>
                                <input
                                    type="radio"
                                    name="productCheck"
                                    checked={form.productCheck === "Y"}
                                    value="Y"
                                    onChange={onChangeHandler}
                                    style={{cursor: 'pointer'}}
                                />{" "}
                                <p style={{margin: '5px 6px'}}>Y</p> 
                            </label>
                        </div>
                        
                        <div>
                            <label style={{display: 'flex', flexFlow: 'row'}}>
                                <input
                                    type="radio"
                                    name="productCheck"
                                    checked={form.productCheck === "N"}
                                    value="N"
                                    onChange={onChangeHandler}
                                    style={{cursor: 'pointer'}}
                                />{" "}
                                <p style={{margin: '5px 6px'}}>N</p>
                            </label>
                        </div>
                        
                    </div>
                </div>


                <div className={UserInfoCSS.info} style={{width: '400px'}}>
                    <p>소분류</p>
                    <div className={UserInfoCSS.txt}>
                    <select
                            style={{width: '95%', padding: '5px 10px'}}
                            name="smallCategory"
                            value={form?.smallCategory?.smallCategoryId}
                            onChange={onChangeSmallCategoryHandler}
                            disabled={!selectedMediumCategory}
                        >
                            <option value="">소분류 선택</option>{" "}
                            {/* 기본 선택 옵션 */}
                            <option value="">소분류 선택</option>
                            {Array.isArray(smallCategories) &&
                                smallCategories?.map((category) => (
                                    <option
                                        key={category.smallCategoryId}
                                        value={category.smallCategoryId}
                                    >
                                        {category.smallCategoryName}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className={UserInfoCSS.info}>
				<p>옵션 추가</p>
				<div>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <div className={UserInfoCSS.txt} style={{width: '250px'}}>
                        <input
                            
                            name="optionDesc"
                            placeholder="옵션 설명"
                            onChange={onChangeOptionInputHandler}
                        />
                        </div>

                        <div className={UserInfoCSS.txt} style={{width: '250px', margin: '0 30px'}}>
                        <input
                            name="addPrice"
                            placeholder="추가 가격"
                            type="number"
                            onChange={onChangeOptionHandler}
                        />
                        </div>
                        
                        <div className={UserInfoCSS.txt} style={{width: '250px'}}>
                        <input
                            name="optionQuantity"
                            placeholder="옵션 수량"
                            type="number"
                            onChange={onChangeOptionHandler}
                        />
                        </div>
                        

                        <button onClick={onAddOptionHandler} style={{width: '93px', height: '38px', borderRadius: '5px', color: '#fff', backgroundColor: '#647453', margin: '0 0 0 10px'}}>
                            옵션 추가
                        </button>
                    </div>
                </div>
			</div>   


            <div style={{width: '100%'}}>
                            <td colSpan="2" style={{width: '1000px', borderRadius: '15px', padding: '20px'}}>
                                <h4 style={{fontWeight: '400', color: '#222',}}>옵션 리스트</h4>
                                <ul>
                                        {form?.options?.map((opt, index) => (
                                            opt.optionCheck === "Y" && (
                                                <li key={index}>
                                                    <input
                                                        name="optionDesc"
                                                        value={opt.optionDesc}
                                                        onChange={(e) => onChangeOptionHandler(e, index)}
                                                    />
                                                    <input
                                                        name="addPrice"
                                                        type="number"
                                                        value={opt.addPrice}
                                                        onChange={(e) => onChangeOptionHandler(e, index)}
                                                    />
                                                    <input
                                                        name="optionQuantity"
                                                        type="number"
                                                        value={opt.optionQuantity}
                                                        onChange={(e) => onChangeOptionHandler(e, index)}
                                                    />
                                                    <button onClick={() => onDeleteOptionHandler(index)}>삭제</button>
                                                </li>
                                            )
                                        ))}
                                    </ul>
                            </td>
                        </div>     

                
                <div style={{width: '500px', height: '112px', backgroundColor: '#fff', position: 'relative', border: '1px solid #222', borderRadius: '15px', overflow: 'hidden', margin: '20px 0'}}>
                <div style={{width: '100px'}}>
                    {imageUrl && <img src={imageUrl} alt="preview" />}
                    <input
                        style={{ display: "none" }}
                        type="file"
                        ref={imageInput}
                            onChange={onChangeImageUpload}
                    />
                    <button style={{width: '100px', height: '40px', color: '#fff', backgroundColor: '#647453', borderRadius: '5px', position: 'absolute', bottom: '20px', right: '20px'}} onClick={onClickImageUpload}>
                        업로드
                    </button>
                </div>
                </div>

                <div>
                    <p>상품 설명</p>
                    
                    <div style={{width: '100%', height: '100px', overflow: 'scroll'}}>
                    <textarea
                            style={{width: '100%', height: '100%'}}
                            name="productDesc"
                            placeholder="상품 설명"
                            value={form.productDesc}
                            onChange={onChangeHandler}
                    ></textarea>
                    </div>
                </div>


               
                <div style={{margin: '30px 0 0 1220px'}}>
                    <button style={{width: '125px', height: '50px', fontSize:'21px', borderRadius: '5px', backgroundColor: '#647453', color: '#fff'}} onClick={onSaveHandler}>저장</button>
                </div>
            </div>
    );
}

export default ProductUpdate;