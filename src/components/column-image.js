import { Image } from 'antd';

const ColumnImage = ({ image, row, size = 100 }) => {
  return (
    <Image
      src={image || 'https://via.placeholder.com/150'}
      alt='img_gallery'
      width={size}
      height={size}
      className='rounded border'
      preview
      placeholder={!image}
      key={image + row?.id}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default ColumnImage;
