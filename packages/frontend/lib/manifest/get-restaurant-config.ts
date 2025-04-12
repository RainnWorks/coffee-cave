import Manifest from "@mnfst/sdk";

export const getRestaurantConfig = (mnfst: Manifest) => {
    mnfst.single('restaurant-settings')
}